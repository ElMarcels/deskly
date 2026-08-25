"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export default function NeonButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: NeonButtonProps) {
  const baseStyles =
    "font-semibold rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2";

  const variants = {
    primary:
      "bg-gradient-to-r from-neon-purple to-neon-magenta text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:brightness-110",
    secondary:
      "bg-surface-light text-foreground border border-glass-border hover:border-neon-purple/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]",
    danger:
      "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]",
    ghost:
      "bg-transparent text-foreground/70 hover:text-foreground hover:bg-surface-light",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
