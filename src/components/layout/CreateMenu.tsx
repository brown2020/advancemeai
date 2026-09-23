"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/utils/cn";
import { buttonVariants } from "@/components/ui/button-variants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CREATE_ITEMS } from "./nav-config";

type CreateMenuProps = {
  /** "button" for the header, "fab" for the mobile tab bar. */
  variant?: "button" | "fab";
};

export function CreateMenu({ variant = "button" }: CreateMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === "fab" ? (
          <button
            type="button"
            aria-label="Create"
            className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lift transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Plus className={cn("size-6 transition-transform", open && "rotate-45")} />
          </button>
        ) : (
          <button type="button" className={buttonVariants({ size: "sm" })}>
            <Plus className={cn("transition-transform", open && "rotate-45")} aria-hidden />
            Create
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align={variant === "fab" ? "center" : "end"}
        side={variant === "fab" ? "top" : "bottom"}
        sideOffset={variant === "fab" ? 12 : 8}
        className="w-72 p-1.5"
      >
        <ul>
          {CREATE_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                  <item.icon className="size-[18px]" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
