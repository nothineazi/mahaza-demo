import * as React from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-xl border border-foreground/55 bg-card px-4 text-base text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-200 hover:border-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-[invalid=true]:border-destructive";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(control, "h-12", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(control, "min-h-24 py-3", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(control, "h-12 pr-8", className)} {...props} />
));
Select.displayName = "Select";

export function FieldLabel({ htmlFor, children, className }: { htmlFor: string; children: React.ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-sm font-medium", className)}>
      {children}
    </label>
  );
}

/** Message d'erreur relié au champ (aria-describedby) et annoncé poliment. */
export function FieldError({ id, children }: { id: string; children?: React.ReactNode }) {
  return (
    <p id={id} role="alert" className={cn("mt-1.5 text-sm text-destructive", !children && "hidden")}>
      {children}
    </p>
  );
}
