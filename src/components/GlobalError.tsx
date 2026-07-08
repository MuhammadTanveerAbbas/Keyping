import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
 children: ReactNode;
}

interface State {
 hasError: boolean;
}

export class GlobalError extends Component<Props, State> {
 constructor(props: Props) {
  super(props);
  this.state = { hasError: false };
 }

 static getDerivedStateFromError(): State {
  return { hasError: true };
 }

 componentDidCatch(error: Error, info: ErrorInfo) {
  console.error(
   JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "error",
    message: error.message,
    stack: error.stack,
    componentStack: info.componentStack,
   }),
  );
 }

 render() {
  if (this.state.hasError) {
   return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 bg-black">
     <div className="rounded-full bg-red-500/10 p-6">
      <AlertTriangle className="h-12 w-12 text-red-400" />
     </div>
     <h1 className="font-display text-2xl font-bold text-white">
      Critical Error
     </h1>
     <p className="font-sans text-sm text-slate-400 text-center max-w-md">
      Something went wrong. Please reload the page to continue.
     </p>
     <button
      onClick={() => window.location.reload()}
      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-black font-sans font-semibold text-sm px-6 py-3 rounded-xl transition-all"
     >
      <RefreshCw className="h-4 w-4" />
      Reload Application
     </button>
    </div>
   );
  }

  return this.props.children;
 }
}
