import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class GlobalError extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application error", {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 p-8 text-center" role="alert">
          <div className="rounded-full bg-red-500/10 p-6"><AlertTriangle className="h-12 w-12 text-red-400" /></div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Something went wrong</h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">The app could not finish loading this view. Reload the page to try again.</p>
          </div>
          <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"><RefreshCw className="h-4 w-4" />Reload application</button>
        </div>
      );
    }
    return this.props.children;
  }
}
