"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import NeonButton from "@/components/ui/NeonButton";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({ open, onClose, title, children, footer }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#12122a] border border-[rgba(168,85,247,0.3)] shadow-[0_0_40px_rgba(168,85,247,0.2)] animate-slide-up">
        <div className="flex items-center justify-between border-b border-[rgba(168,85,247,0.1)] px-5 py-4">
          <h3 className="text-sm font-bold text-[#e0e0ff]">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#1a1a3e] text-[#e0e0ff]/40 hover:text-[#e0e0ff] cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-[rgba(168,85,247,0.1)] px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = "Eliminar", danger = true }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={
        <>
          <NeonButton variant="ghost" onClick={onClose}>Cancelar</NeonButton>
          <NeonButton variant={danger ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</NeonButton>
        </>
      }>
      <p className="text-sm text-[#e0e0ff]/70">{message}</p>
    </Modal>
  );
}
