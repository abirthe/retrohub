import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { checkIsAdmin } from '@/lib/shopApi';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const verifyAdmin = async () => {
      try {
        const admin = await checkIsAdmin();
        if (isMounted) {
          setIsAdmin(admin);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    };

    verifyAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      verifyAdmin();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, loading };
}


