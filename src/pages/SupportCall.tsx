import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Shield, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] }],
};

const SupportCall = () => {
  const { channelId = "" } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const mode = search.get("mode") === "audio" ? "audio" : "video";
  const shouldStart = search.get("start") === "1";

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState("جاري التجهيز...");
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(mode === "video");
  const [remoteReady, setRemoteReady] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processedSignals = useRef<Set<string>>(new Set());

  const sendSignal = useCallback(async (sid: string, signalType: string, payload: any) => {
    if (!user || !channelId) return;
    await (supabase as any).from("support_call_signals").insert({
      session_id: sid,
      channel_id: channelId,
      sender_id: user.id,
      signal_type: signalType,
      payload,
    });
  }, [channelId, user]);

  const ensureSession = useCallback(async () => {
    if (!user || !channelId) return null;
    if (shouldStart) {
      const { data, error } = await (supabase as any).from("support_call_sessions").insert({
        channel_id: channelId,
        created_by: user.id,
        mode,
        status: "waiting",
      }).select("id").single();
      if (error) throw error;
      return data.id as string;
    }

    const { data, error } = await (supabase as any).from("support_call_sessions")
      .select("id")
      .eq("channel_id", channelId)
      .in("status", ["waiting", "active"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data?.id as string | null;
  }, [channelId, mode, shouldStart, user]);

  const processSignal = useCallback(async (signal: any) => {
    const pc = pcRef.current;
    if (!pc || !user || signal.sender_id === user.id || processedSignals.current.has(signal.id)) return;
    processedSignals.current.add(signal.id);

    if (signal.signal_type === "offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal(signal.session_id, "answer", answer);
      await (supabase as any).from("support_call_sessions").update({ status: "active" }).eq("id", signal.session_id);
      setStatus("المكالمة متصلة");
    }

    if (signal.signal_type === "answer" && pc.signalingState !== "stable") {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
      await (supabase as any).from("support_call_sessions").update({ status: "active" }).eq("id", signal.session_id);
      setStatus("المكالمة متصلة");
    }

    if (signal.signal_type === "ice" && signal.payload) {
      await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
    }

    if (signal.signal_type === "end") {
      setStatus("تم إنهاء المكالمة من الطرف الآخر");
      pc.close();
    }
  }, [sendSignal, user]);

  useEffect(() => {
    if (!user || !channelId) return;
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const start = async () => {
      try {
        const sid = await ensureSession();
        if (!sid) {
          setStatus("لا توجد مكالمة نشطة حالياً");
          return;
        }
        if (!mounted) return;
        setSessionId(sid);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === "video" });
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          const [remoteStream] = event.streams;
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
          if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
          setRemoteReady(true);
          setStatus("المكالمة متصلة");
        };
        pc.onicecandidate = (event) => {
          if (event.candidate) sendSignal(sid, "ice", event.candidate.toJSON());
        };

        channel = supabase.channel(`support_call_${sid}`)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_call_signals", filter: `session_id=eq.${sid}` }, (payload) => {
            processSignal(payload.new).catch(() => setStatus("تعذّرت معالجة إشارة الاتصال"));
          })
          .subscribe();

        const { data: previousSignals } = await (supabase as any).from("support_call_signals").select("*").eq("session_id", sid).order("created_at", { ascending: true });
        for (const s of previousSignals ?? []) await processSignal(s);

        if (shouldStart) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await sendSignal(sid, "offer", offer);
          setStatus("بانتظار انضمام الطرف الآخر...");
        } else {
          setStatus("جاري الانضمام للمكالمة...");
        }
      } catch (err: any) {
        setStatus("تعذّر بدء المكالمة");
        toast.error(err?.message || "تحقق من إذن الكاميرا والميكروفون");
      }
    };

    start();
    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
      pcRef.current?.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [channelId, ensureSession, mode, processSignal, sendSignal, shouldStart, user]);

  const endCall = async () => {
    if (sessionId) {
      await sendSignal(sessionId, "end", { endedAt: new Date().toISOString() });
      await (supabase as any).from("support_call_sessions").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", sessionId);
    }
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    navigate(roles.includes("admin") ? "/dashboard/admin" : "/admin-contact");
  };

  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !micOn; });
    setMicOn(!micOn);
  };

  const toggleCamera = () => {
    streamRef.current?.getVideoTracks().forEach((track) => { track.enabled = !cameraOn; });
    setCameraOn(!cameraOn);
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-6 flex flex-col">
      <div className="mx-auto w-full max-w-6xl flex-1 flex flex-col gap-4">
        <header className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg truncate">مكالمة دعم مباشرة</h1>
              <p className="text-xs text-muted-foreground truncate">{status}</p>
            </div>
          </div>
          <Badge variant="outline">{mode === "video" ? "فيديو" : "صوت"}</Badge>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 flex-1 min-h-[520px]">
          <div className="relative glass rounded-2xl overflow-hidden min-h-[420px] bg-card/70">
            {mode === "video" ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center gap-4">
                <UserCircle className="h-24 w-24 text-primary" />
                <audio ref={remoteAudioRef} autoPlay />
              </div>
            )}
            {!remoteReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm text-center p-6">
                <div>
                  <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/15 text-primary flex items-center justify-center animate-pulse">
                    {mode === "video" ? <Video className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                  </div>
                  <div className="font-bold">{status}</div>
                  <div className="text-xs text-muted-foreground mt-1">اترك هذه النافذة مفتوحة حتى ينضم الطرف الآخر</div>
                </div>
              </div>
            )}
          </div>

          <aside className="glass rounded-2xl p-4 flex flex-col gap-4">
            <div className="rounded-xl bg-secondary/30 overflow-hidden aspect-video flex items-center justify-center">
              {mode === "video" ? <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" /> : <Mic className="h-12 w-12 text-accent" />}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>قناة الدعم: <span className="font-mono">{channelId.slice(0, 8)}</span></div>
              <div>جلسة الاتصال: <span className="font-mono">{sessionId?.slice(0, 8) || "—"}</span></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-auto">
              <Button variant={micOn ? "outline" : "destructive"} size="icon" onClick={toggleMic} aria-label="الميكروفون">
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button variant={cameraOn ? "outline" : "destructive"} size="icon" onClick={toggleCamera} disabled={mode !== "video"} aria-label="الكاميرا">
                {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button variant="destructive" size="icon" onClick={endCall} aria-label="إنهاء المكالمة">
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
};

export default SupportCall;