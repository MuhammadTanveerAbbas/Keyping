import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("View error", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center" role="alert">
        <div className="rounded-full bg-red-50 p-4"><AlertTriangle className="h-8 w-8 text-red-500" /></div>
        <h2 className="font-display text-xl font-bold text-slate-900">This view could not load</h2>
        <p className="max-w-md text-sm text-slate-500">{this.state.error?.message ?? "An unexpected error occurred"}</p>
        <Button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-700"><RefreshCw className="mr-2 h-4 w-4" />Reload page</Button>
      </div>
    );
  }
}
