"use client";

import { ScrollText, Shield, Users, MessagesSquare, Ban, FileWarning, Info } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import GlassCard from "@/components/ui/GlassCard";

const SECTIONS = [
  {
    icon: Users,
    title: "1. Respeto y convivencia",
    items: [
      "Trata a todos los usuarios con respeto. No toleramos acoso, insultos ni discriminación por ningún motivo.",
      "No suplantes la identidad de otras personas ni crees cuentas falsas para engañar o acosar.",
      "Ayuda a mantener un ambiente positivo en las salas de estudio y en los mensajes.",
    ],
  },
  {
    icon: MessagesSquare,
    title: "2. Contenido apropiado",
    items: [
      "No publiques contenido violento, sexual, ilegal o que incite al odio.",
      "Está prohibido compartir información personal de otros usuarios sin su consentimiento.",
      "No hagas spam ni envíes mensajes no deseados o repetitivos.",
    ],
  },
  {
    icon: FileWarning,
    title: "3. Uso correcto de la plataforma",
    items: [
      "No intentes explotar, hackear ni acceder a datos de otros usuarios o del sistema.",
      "Usa las herramientas de estudio (notas, tareas, salas) con fines legítimos de aprendizaje.",
      "No crees salas o contenidos con nombres o descripciones inapropiadas.",
    ],
  },
  {
    icon: Ban,
    title: "4. Sanciones",
    items: [
      "El incumplimiento de estas reglas puede dar lugar a la suspensión temporal o indefinida de tu cuenta.",
      "Antes de restringir una cuenta se revisará el caso; las decisiones del equipo pueden ser definitivas.",
    ],
  },
];

export default function ReglasPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold gradient-neon flex items-center gap-2">
            <ScrollText size={24} /> Reglas de la plataforma
          </h1>
          <p className="text-xs text-[#e0e0ff]/40 mt-1">
            Estas normas garantizan un espacio seguro y útil para toda la comunidad de Deskly.
          </p>
        </div>

        <GlassCard className="p-6">
          <div className="flex items-start gap-3 mb-5 rounded-xl bg-[rgba(168,85,247,0.08)] border border-[rgba(168,85,247,0.15)] p-4">
            <Info size={18} className="text-[#06b6d4] mt-0.5 shrink-0" />
            <p className="text-xs text-[#e0e0ff]/60 leading-relaxed">
              Al usar Deskly aceptas cumplir este reglamento. El incumplimiento puede derivar en
              la suspensión de tu cuenta. El equipo de la plataforma se reserva el derecho de
              actualizar estas reglas cuando sea necesario.
            </p>
          </div>

          <div className="space-y-6">
            {SECTIONS.map(section => {
              const Icon = section.icon;
              return (
                <section key={section.title}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={18} className="text-[#a855f7]" />
                    <h2 className="text-sm font-bold text-[#e0e0ff]">{section.title}</h2>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {section.items.map(item => (
                      <li key={item} className="flex gap-2 text-sm text-[#e0e0ff]/70 leading-relaxed">
                        <span className="text-[#a855f7]/60 shrink-0 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-[rgba(168,85,247,0.1)] flex items-center gap-2">
            <Shield size={16} className="text-[#22c55e]" />
            <p className="text-xs text-[#e0e0ff]/50">
              <span className="font-bold text-[#e0e0ff]/70">Consejo:</span> ante cualquier duda o
              incidencia, abre un ticket en la sección <b className="text-[#a855f7]">Soporte</b>.
            </p>
          </div>
        </GlassCard>
      </div>
    </AppLayout>
  );
}
