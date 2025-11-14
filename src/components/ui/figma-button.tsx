"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const figmaButtonVariants = cva(
  "button-figma inline-flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-medium text-xs py-3.5",
  {
    variants: {
      variant: {
        default: "bg-button-bg text-figma-primary hover:bg-button-hover w-full",
        primary: "bg-figma-primary text-figma-white hover:bg-figma-secondary",
        secondary:
          "bg-figma-secondary text-figma-primary hover:bg-figma-tertiary",
        track: "bg-track-primary text-white hover:bg-track-secondary",
        road: "bg-road-primary text-figma-primary hover:bg-road-secondary",
        trail: "bg-trail-primary text-white hover:bg-trail-secondary",
        jingwan: "bg-jingwan-primary text-white hover:bg-jingwan-secondary",
      },
      size: {
        default: "w-[327px]",
        sm: "h-8 w-24",
        lg: "h-12 w-40",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface FigmaButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof figmaButtonVariants> {
  asChild?: boolean;
}

const FigmaButton = React.forwardRef<HTMLButtonElement, FigmaButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(figmaButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
FigmaButton.displayName = "FigmaButton";

export { FigmaButton, figmaButtonVariants };
