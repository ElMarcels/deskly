"use client";

import { useState } from "react";
import AuthForm from "@/components/auth/AuthForm";

export default function RegisterPage() {
  const [mode, setMode] = useState<"login" | "register">("register");

  return (
    <AuthForm
      mode={mode}
      onToggleMode={() => setMode(mode === "login" ? "register" : "login")}
    />
  );
}
