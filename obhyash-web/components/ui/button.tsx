import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#12544F] text-white shadow-[0_4.5px_0_#092328] hover:brightness-105 active:shadow-[0_1px_0_#092328] active:translate-y-[3.5px] rounded-[14px]",
        destructive:
          "bg-[#740A03] text-white shadow-[0_4.5px_0_#3F0502] hover:brightness-105 active:shadow-[0_1px_0_#3F0502] active:translate-y-[3.5px] rounded-[14px] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-[#12544F]/40 dark:border-[#12544F] bg-transparent text-[#12544F] dark:text-[#34D399] rounded-[12px] hover:bg-[#12544F]/5 dark:hover:bg-white/5 active:scale-[0.98]",
        secondary:
          "bg-[#F1F5F9] dark:bg-[#1C1C1E] text-[#334155] dark:text-[#E4E4E7] border border-[#E2E8F0] dark:border-[#27272A] shadow-[0_3.5px_0_#CBD5E1] dark:shadow-[0_3.5px_0_#121214] active:shadow-[0_1px_0_#CBD5E1] dark:active:shadow-[0_1px_0_#121214] active:translate-y-[2.5px] hover:brightness-105 rounded-[14px]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 rounded-xl",
        link: "text-[#12544F] dark:text-[#34D399] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        xs: "h-7 gap-1 rounded-lg px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-xl px-6 text-base has-[>svg]:px-4",
        icon: "size-10 rounded-xl",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-lg",
        "icon-lg": "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
