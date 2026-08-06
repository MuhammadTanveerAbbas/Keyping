import {
 createContext,
 useContext,
 useEffect,
 useState,
 ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
 session: Session | null;
 user: User | null;
 loading: boolean;
 signInWithGoogle: () => Promise<void>;
 signInWithEmail: (email: string, password: string) => Promise<void>;
 signUpWithEmail: (email: string, password: string) => Promise<void>;
 resetPassword: (email: string) => Promise<void>;
 signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
 const [session, setSession] = useState<Session | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
   setSession(session);
   setLoading(false);
   if (window.location.hash.includes("access_token")) {
    window.history.replaceState(null, "", window.location.pathname);
   }
  });

  const {
   data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
   setSession(session);
   setLoading(false);
   if (window.location.hash.includes("access_token")) {
    window.history.replaceState(null, "", window.location.pathname);
   }
  });

  return () => subscription.unsubscribe();
 }, []);

 const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
   provider: "google",
   options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
 };

 const signInWithEmail = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
 };

 const signUpWithEmail = async (email: string, password: string) => {
  const { error } = await supabase.auth.signUp({
   email,
   password,
   options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
 };

 const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
   redirectTo: `${window.location.origin}/auth`,
  });
  if (error) throw error;
 };

 const signOut = async () => {
  await supabase.auth.signOut();
 };

 return (
  <AuthContext.Provider
   value={{
    session,
    user: session?.user ?? null,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
   }}
  >
   {children}
  </AuthContext.Provider>
 );
}

export function useAuth() {
 const context = useContext(AuthContext);
 if (!context) throw new Error("useAuth must be used within AuthProvider");
 return context;
}
