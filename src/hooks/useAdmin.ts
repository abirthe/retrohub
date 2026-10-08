import { useAuth } from "@/contexts/AuthContext";

export function useAdmin() {
  const { isAdmin, adminLoading } = useAuth();
  return { isAdmin, loading: adminLoading };
}
