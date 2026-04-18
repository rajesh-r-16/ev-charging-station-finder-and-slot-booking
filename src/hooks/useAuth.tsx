import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { friendlyAuthError } from '@/lib/authValidation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener FIRST, then fetch initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });

    if (error) {
      toast({
        title: "Sign Up Error",
        description: friendlyAuthError(error.message),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Created",
        description: "Please check your email to verify your account.",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign In Error",
        description: friendlyAuthError(error.message),
        variant: "destructive",
      });
      return { error };
    }

    // Block sign-in if email isn't verified
    if (data.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      const verifyError = { message: "Email not confirmed" };
      toast({
        title: "Email Not Verified",
        description: friendlyAuthError(verifyError.message),
        variant: "destructive",
      });
      return { error: verifyError };
    }

    toast({
      title: "Welcome Back!",
      description: "You have been successfully signed in.",
    });

    return { error: null };
  };

  const signOut = async () => {
    try {
      // Global sign-out invalidates all sessions for this user
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      // Ignore — we'll still clear local state below
    }

    // Defensive: clear any lingering Supabase auth keys from storage
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') || key.includes('supabase.auth')) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // localStorage might be unavailable; ignore
    }

    setUser(null);
    setSession(null);

    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
  };

  const value = { user, session, loading, signUp, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
