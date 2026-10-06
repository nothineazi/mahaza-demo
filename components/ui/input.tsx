import * as React from "react";
import { cn } from "@/lib/utils";

const fieldClasses =
  "w-full rounded-md border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => (
  <input type={type} ref={ref} className={cn(fieldClasses, "h-11", className)} {...props} />
));
Input.displayName = "Input";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldClasses, "min-h-20 py-2", className)} {...props} />
));
Textarea.displayName = "Textarea";

export { Input, Textarea };
