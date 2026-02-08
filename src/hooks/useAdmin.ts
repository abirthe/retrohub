import { useState, useEffect } from 'react';
import { checkIsAdmin } from '@/lib/shopApi';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkIsAdmin().then((admin) => {
      setIsAdmin(admin);
      setLoading(false);
    }).catch(() => {
      setIsAdmin(false);
      setLoading(false);
    });
  }, []);

  return { isAdmin, loading };
}

