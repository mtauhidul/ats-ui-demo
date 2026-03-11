/**
 * Navigation singleton for use outside React components
 * (e.g., RTK Query base query, fetch interceptors)
 *
 * Usage:
 *   In App.tsx: register with setNavigate(navigate)
 *   Elsewhere:  navigateTo('/login')
 */

type NavigateFn = (to: string) => void;

let _navigate: NavigateFn | null = null;

export function setNavigate(fn: NavigateFn): void {
  _navigate = fn;
}

export function navigateTo(to: string): void {
  if (_navigate) {
    _navigate(to);
  } else {
    // Fallback if navigate hasn't been registered yet (e.g. before app mounts)
    window.location.href = to;
  }
}
