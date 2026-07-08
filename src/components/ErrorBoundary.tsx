import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
 children: ReactNode;
 fallback?: ReactNode;
}

interface State {
 hasError: boolean;
 error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
 constructor(props: Props) {
  super(props);
  this.state = { hasError: false, error: null };
 }

 static getDerivedStateFromError(error: Error): State {
  return { hasError: true, error };
 }

 componentDidCatch(error: Error, info: ErrorInfo) {
  console.error("ErrorBoundary caught:", error, info.componentStack);
 }

 render() {
  if (this.state.hasError) {
   if (this.props.fallback) return this.props.fallback;

   return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
     <div className="rounded-full bg-red-50 p-4">
      <AlertTriangle className="h-8 w-8 text-red-500" />
     </div>
     <h2 className="font-display text-xl font-bold text-slate-900">
      Something went wrong
     </h2>
     <p className="font-sans text-sm text-slate-500 text-center max-w-md">
      {this.state.error?.message || "An unexpected error occurred"}
     </p>
     <Button
      onClick={() => window.location.reload()}
      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-sans font-semibold rounded-xl"
     >
      <RefreshCw className="h-4 w-4 mr-2" />
      Reload page
     </Button>
    </div>
   );
  }

  return this.props.children;
 }
}
