/**
 * Auth utility helpers for route protections, sanitization, and session state.
 */

export const PROTECTED_AUTH_ROUTES = [
  "/admin",
  "/orders",
  "/console",
  "/support",
  "/payment",
] as const;

/**
 * Determines whether the user is on an account-specific or protected route
 * that should redirect to the storefront ("/") upon sign out.
 */
export function isProtectedSignOutRoute(pathname: string): boolean {
  const cleanPath = pathname.split("?")[0].split("#")[0];
  return PROTECTED_AUTH_ROUTES.some(
    (route) => cleanPath === route || cleanPath.startsWith(`${route}/`),
  );
}
