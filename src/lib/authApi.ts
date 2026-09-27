// src/lib/authApi.ts
// Authentication utilities and role checks.

import { supabase } from "@/integrations/supabase/client";

/** Returns true if the currently authenticated user has the 'admin' role. */
export async function checkIsAdmin(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });

  if (error) return false;
  return data ?? false;
}
