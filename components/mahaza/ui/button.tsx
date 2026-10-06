import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Bouton premium : pilule, transitions douces, cible ≥ 44 px. */
export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-wide transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-lift",
        gold: "bg-accent text-accent-foreground shadow-soft hover:bg-accent/90 hover:shadow-lift",
        outline: "border border-foreground/25 bg-transparent text-foreground hover:border-primary hover:text-primary",
        "outline-light": "border border-background/50 bg-transparent text-background hover:border-accent hover:text-accent",
        soft: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost: "text-foreground hover:bg-muted",
        danger: "border border-destructive text-destructive hover:bg-destructive/10",
        whatsapp: "bg-success text-white shadow-soft hover:bg-success/90",
      },
      size: {
        sm: "min-h-10 px-4 text-sm",
        md: "min-h-11 px-6 text-sm",
        lg: "min-h-14 px-9 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, type, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...(asChild ? {} : { type: type ?? "button" })} {...props} />;
});
Button.displayName = "Button";
