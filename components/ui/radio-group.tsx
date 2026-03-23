"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as React from "react";

import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={cn("grid gap-2", className)} {...props} />
));
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "rounded-2xl border border-border bg-radix-gray-a-2 text-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)] transition hover:border-radix-teal-a-6 hover:bg-radix-teal-a-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:border-radix-teal-a-7 data-[state=checked]:bg-radix-teal-a-4 data-[state=checked]:text-accent-foreground",
      className
    )}
    {...props}
  />
));
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
