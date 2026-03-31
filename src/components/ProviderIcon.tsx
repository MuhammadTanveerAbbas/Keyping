import { type LucideIcon, Bot, Zap, Brain, CreditCard, Github, Twitter, StickyNote, Database, Wrench, Key, Cloud, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  openai: Bot,
  groq: Zap,
  anthropic: Brain,
  stripe: CreditCard,
  github: Github,
  twitter: Twitter,
  notion: StickyNote,
  supabase: Database,
  aws: Cloud,
  gemini: Sparkles,
  custom: Wrench,
};

interface ProviderIconProps {
  provider: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ProviderIcon({ provider, className, size = "md" }: ProviderIconProps) {
  const Icon = iconMap[provider] || Key;
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return <Icon className={cn(sizeClasses[size], "text-white/70", className)} />;
}

export function ProviderIconBadge({ provider, className }: { provider: string; className?: string }) {
  return (
    <div className={cn("h-8 w-8 rounded-lg bg-blue-50 dark:bg-white/5 border border-blue-100 dark:border-white/10 flex items-center justify-center", className)}>
      <ProviderIcon provider={provider} size="md" className="text-blue-600 dark:text-white/70" />
    </div>
  );
}
