import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/authApi";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean | null;
  adminLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ user: User | null; session: unknown }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; session: unknown }>;
  signInWithGoogle: (returnTo?: string) => Promise<{ provider: string; url: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);

  // Single source of truth for auth state & admin status
  useEffect(() => {
    let settled = false;

    const verifyAdminStatus = async (currentUser: User | null) => {
      if (!currentUser) {
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }
      try {
        const admin = await checkIsAdmin();
        setIsAdmin(admin);
      } catch {
        setIsAdmin(false);
      } finally {
        setAdminLoading(false);
      }
    };

    const settle = (sessionUser: User | null) => {
      if (settled) return;
      settled = true;
      setUser(sessionUser);
      setLoading(false);
      verifyAdminStatus(sessionUser);
    };

    // Hard timeout — if Supabase doesn't respond in 5s, unblock the UI
    const timeout = setTimeout(() => settle(null), 5000);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => settle(session?.user ?? null))
      .catch(() => settle(null))
      .finally(() => clearTimeout(timeout));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setLoading(false);
      verifyAdminStatus(nextUser);
    });

    return () => {
      settled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async (returnTo?: string) => {
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (returnTo && returnTo !== "/") {
      callbackUrl.searchParams.set("returnTo", returnTo);
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn("Supabase auth signOut warning:", error);
      }
    } finally {
      setUser(null);
      setIsAdmin(false);
    }
  };

  const resetPassword = async (email: string) => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        adminLoading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
