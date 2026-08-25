"use client";

import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export default function GlassCard({ children, className = "", glow = false, onClick }: GlassCardProps) {
  return (
    <div className={`glass-card ${glow ? "neon-glow" : ""} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
