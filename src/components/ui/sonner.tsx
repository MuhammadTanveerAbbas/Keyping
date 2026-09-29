import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group w-full items-start rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-lg shadow-slate-900/10",
          description: "text-sm leading-relaxed text-slate-500",
          actionButton: "rounded-md bg-slate-900 px-3 text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500",
          cancelButton: "rounded-md bg-slate-100 px-3 text-slate-700 hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500",
          closeButton: "rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
