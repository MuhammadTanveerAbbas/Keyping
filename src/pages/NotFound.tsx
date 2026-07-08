import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";
import { useEffect } from "react";

const NotFound = () => {
 const navigate = useNavigate();

 useEffect(() => {
  document.title = "404 - Page Not Found | KeyPing";
 }, []);

 return (
  <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 bg-white">
   <div className="relative">
    <div className="text-8xl font-display font-extrabold text-blue-500/20 select-none">
     404
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
     <Search className="h-10 w-10 text-blue-500" />
    </div>
   </div>
   <h1 className="font-display text-2xl font-bold text-slate-900">
    Page not found
   </h1>
   <p className="font-sans text-sm text-slate-500 text-center max-w-md">
    The page you're looking for doesn't exist or has been moved.
   </p>
   <Button
    onClick={() => navigate("/")}
    className="bg-blue-600 hover:bg-blue-700 text-white font-sans font-semibold rounded-xl"
   >
    <ArrowLeft className="h-4 w-4 mr-2" /> Go home
   </Button>
  </div>
 );
};

export default NotFound;
