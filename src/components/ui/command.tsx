import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Terminal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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

const CommandDialog = ({ children, ...props }: DialogProps) => {
 return (
  <Dialog {...props}>
   <DialogContent className="overflow-hidden p-0 border-0 bg-transparent shadow-none max-w-[620px]">
    {/* Outer glow ring */}
    <div className="relative rounded-2xl overflow-hidden"
     style={{
      background: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.1) 50%, rgba(6,182,212,0.08) 100%)",
      padding: "1px",
      boxShadow: "0 0 0 1px rgba(59,130,246,0.2), 0 0 60px rgba(59,130,246,0.15), 0 25px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
     }}
    >
     <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(180deg, #0d1117 0%, #0a0e14 100%)" }}>
      {/* Terminal title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "rgba(59,130,246,0.12)", background: "rgba(255,255,255,0.02)" }}>
       <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-[0_0_6px_rgba(255,95,87,0.6)]" />
        <div className="w-3 h-3 rounded-full bg-[#febc2e] shadow-[0_0_6px_rgba(254,188,46,0.6)]" />
        <div className="w-3 h-3 rounded-full bg-[#28c840] shadow-[0_0_6px_rgba(40,200,64,0.6)]" />
       </div>
       <div className="flex items-center gap-2">
        <Terminal className="h-3 w-3" style={{ color: "rgba(59,130,246,0.6)" }} />
        <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "rgba(148,163,184,0.5)" }}>keyping Command Palette</span>
       </div>
       <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded border" style={{ color: "rgba(148,163,184,0.4)", borderColor: "rgba(148,163,184,0.15)", background: "rgba(255,255,255,0.03)" }}>esc</kbd>
      </div>
      <Command className="bg-transparent [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-blue-500/40 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-4 [&_[cmdk-input-wrapper]_svg]:w-4 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4">
       {children}
      </Command>
     </div>
    </div>
   </DialogContent>
  </Dialog>
 );
};

const CommandInput = React.forwardRef<
 React.ElementRef<typeof CommandPrimitive.Input>,
 React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
 <div className="flex items-center px-4 py-1" style={{ borderBottom: "1px solid rgba(59,130,246,0.1)" }} cmdk-input-wrapper="">
  {/* Prompt symbol */}
  <span className="font-mono text-sm mr-2 select-none" style={{ color: "rgba(59,130,246,0.7)", textShadow: "0 0 8px rgba(59,130,246,0.5)" }}>❯</span>
  <CommandPrimitive.Input
   ref={ref}
   className={cn(
    "flex h-12 w-full bg-transparent py-3 font-mono text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50",
    "placeholder:text-slate-600 caret-blue-400",
    className,
   )}
   style={{ color: "rgba(226,232,240,0.9)" }}
   {...props}
  />
  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded ml-2 shrink-0" style={{ color: "rgba(148,163,184,0.3)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(148,163,184,0.1)" }}>⌘K</span>
 </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
 React.ElementRef<typeof CommandPrimitive.List>,
 React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
 <CommandPrimitive.List
  ref={ref}
  className={cn("max-h-[340px] overflow-y-auto overflow-x-hidden py-2", className)}
  {...props}
 />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
 React.ElementRef<typeof CommandPrimitive.Empty>,
 React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
 <CommandPrimitive.Empty
  ref={ref}
  className="py-10 text-center font-mono text-xs"
  style={{ color: "rgba(148,163,184,0.35)" }}
  {...props}
 />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
 React.ElementRef<typeof CommandPrimitive.Group>,
 React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
 <CommandPrimitive.Group
  ref={ref}
  className={cn(
   "overflow-hidden px-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
   className,
  )}
  {...props}
 />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
 React.ElementRef<typeof CommandPrimitive.Separator>,
 React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
 <CommandPrimitive.Separator
  ref={ref}
  className={cn("-mx-1 my-1.5 h-px", className)}
  style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.15), transparent)" }}
  {...props}
 />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
 React.ElementRef<typeof CommandPrimitive.Item>,
 React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
 <CommandPrimitive.Item
  ref={ref}
  className={cn(
   "group relative flex cursor-default select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none font-mono transition-all duration-150",
   "text-slate-400 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-30",
   "data-[selected='true']:text-slate-100",
   className,
  )}
  style={{
   // applied via inline so we can use CSS vars from data attrs cleanly
  }}
  {...props}
 />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
 return (
  <span
   className={cn("ml-auto font-mono text-[10px] tracking-widest", className)}
   style={{ color: "rgba(148,163,184,0.35)" }}
   {...props}
  />
 );
};
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
