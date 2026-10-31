import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn("flex h-full w-full flex-col overflow-hidden", className)}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

/* ── Dialog — no injected close button ──────────────────────────── */
const CommandDialog = ({ children, open, onOpenChange, ...props }: DialogProps) => (
  <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} {...props}>
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-[50%] z-50 translate-x-[-50%] outline-none",
          "w-[calc(100%-1.5rem)] max-w-[560px]",
          "top-[6%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%]",
          "overflow-hidden rounded-2xl bg-white",
          "border border-slate-200",
          "shadow-[0_4px_6px_-1px_rgba(15,23,42,0.06),0_16px_40px_-4px_rgba(15,23,42,0.12),0_40px_80px_-12px_rgba(15,23,42,0.10)]",
          "duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        )}
      >
        <Command
          className={cn(
            "bg-white",
            "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1",
            "[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold",
            "[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-slate-400",
            "[&_[cmdk-group]]:px-2",
            "[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0",
            "[&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-1.5",
            "[&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4",
            "[&_[cmdk-input]]:h-12",
          )}
        >
          {children}
        </Command>
      </DialogPrimitive.Content>
    </DialogPortal>
  </DialogPrimitive.Root>
);

/* ── Input ───────────────────────────────────────────────────────── */
const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center gap-3 border-b border-slate-100 px-3 sm:px-4" cmdk-input-wrapper="">
    <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-12 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
    <DialogPrimitive.Close
      className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      aria-label="Close"
    >
      <X className="h-4 w-4" />
    </DialogPrimitive.Close>
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

/* ── List ────────────────────────────────────────────────────────── */
const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[min(360px,calc(100dvh-14rem))] overflow-y-auto overflow-x-hidden py-2", className)}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

/* ── Empty ───────────────────────────────────────────────────────── */
const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty ref={ref} className="py-10 text-center text-sm text-slate-400" {...props} />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

/* ── Group ───────────────────────────────────────────────────────── */
const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden px-2",
      "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
      className,
    )}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

/* ── Separator ───────────────────────────────────────────────────── */
const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator ref={ref} className={cn("my-1.5 h-px bg-slate-100", className)} {...props} />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

/* ── Item — hover/selected = slate-100 bg only, no colour tricks ── */
const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "group relative flex cursor-default select-none items-center gap-3 rounded-xl px-2 py-2 text-sm outline-none transition-colors duration-100",
      "text-slate-700",
      "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-40",
      "data-[selected='true']:bg-slate-100 data-[selected='true']:text-slate-900",
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

/* ── Shortcut ────────────────────────────────────────────────────── */
const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-[10px] tracking-widest text-slate-400", className)} {...props} />
);
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
