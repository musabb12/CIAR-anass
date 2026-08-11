import { Sparkles } from "lucide-react";

interface GenieLoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

const GenieLoader = ({ text, size = "md" }: GenieLoaderProps) => {
  const sizes = { sm: "h-12 w-12", md: "h-20 w-20", lg: "h-32 w-32" };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6">
      <div className={`relative ${sizes[size]}`}>
        {/* smoke ribbons */}
        {[0, 0.5, 1, 1.5].map((d) => (
          <span
            key={d}
            className="absolute left-1/2 bottom-0 h-2 w-2 -translate-x-1/2 rounded-full bg-gradient-mystic animate-genie-smoke"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
        <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-accent animate-genie-glow" />
      </div>
      {text && <p className="text-xs text-muted-foreground font-display">{text}</p>}
    </div>
  );
};

export default GenieLoader;
