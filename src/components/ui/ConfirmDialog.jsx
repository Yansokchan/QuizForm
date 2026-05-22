import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, HelpCircle, Trash2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

const variantConfig = {
  default: {
    icon: HelpCircle,
    iconWrap: "bg-purple-100 text-purple-600",
    confirmVariant: "default",
  },
  destructive: {
    icon: AlertTriangle,
    iconWrap: "bg-red-50 text-red-600",
    confirmVariant: "destructive",
  },
  danger: {
    icon: Trash2,
    iconWrap: "bg-red-50 text-red-600",
    confirmVariant: "destructive",
  },
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}) {
  const overlayRef = useRef(null);
  const config = variantConfig[variant] ?? variantConfig.default;
  const Icon = config.icon;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      role="presentation"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px] animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === overlayRef.current) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-md rounded-lg border border-purple-200/60 bg-white shadow-xl animate-in zoom-in-95 fade-in-0 duration-200"
      >
        <div className="flex gap-4 p-6 pb-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              config.iconWrap,
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2
              id="confirm-dialog-title"
              className="text-base font-semibold text-slate-800"
            >
              {title}
            </h2>
            {description ? (
              <p
                id="confirm-dialog-description"
                className="mt-2 text-sm leading-relaxed text-slate-500"
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-sm border-slate-200"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={config.confirmVariant}
            className={cn(
              "rounded-sm",
              config.confirmVariant === "default" &&
                "bg-[#6d28d9] text-white hover:bg-[#6d28d9]/90",
              config.confirmVariant === "destructive" &&
                "bg-red-600 text-white hover:bg-red-700",
            )}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
