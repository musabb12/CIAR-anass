// نظام تشفير متطور ومحصن AES-GCM للمحادثات (محمي من انهيار الذاكرة المكدسة)

const enc = new TextEncoder();
const dec = new TextDecoder();

// تحويل آمن للمصفوفات الثنائية إلى Base64 دون التسبب في Stack Overflow
const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// تحويل آمن من Base64 إلى مصفوفة بايتات ثنائية
const base64ToUint8Array = (b64: string): Uint8Array => {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const deriveKey = async (threadId: string): Promise<CryptoKey> => {
  // دمج ثابت فريد من نوعه متبوعاً بالمعرف لرفع مستوى التعقيد ضد التخمين المخزّن مسبقاً
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode("nexus-yemen-sovereign-v1-secure-enclave-" + threadId),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(`salt-hardened-${threadId}`),
      iterations: 100_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

export const encryptMessage = async (
  threadId: string,
  plaintext: string,
): Promise<{ ciphertext: string; iv: string }> => {
  const key = await deriveKey(threadId);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV هو المعيار الذهبي لـ AES-GCM
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext));
  
  return {
    ciphertext: uint8ArrayToBase64(new Uint8Array(ct)),
    iv: uint8ArrayToBase64(iv),
  };
};

export const decryptMessage = async (
  threadId: string,
  ciphertext: string,
  ivB64: string,
): Promise<string> => {
  try {
    const key = await deriveKey(threadId);
    const iv = base64ToUint8Array(ivB64);
    const ct = base64ToUint8Array(ciphertext);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ct as BufferSource);
    return dec.decode(pt);
  } catch (error) {
    console.error("Cryptographic Decryption Fail:", error);
    return "[رسالة مشفرة - فشل التحقق من سلامة البيانات]";
  }
};
