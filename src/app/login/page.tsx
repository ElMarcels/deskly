"use client";

import { useState } from "react";
import AuthForm from "@/components/auth/AuthForm";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <AuthForm
      mode={mode}
      onToggleMode={() => setMode(mode === "login" ? "register" : "login")}
    />
  );
}
