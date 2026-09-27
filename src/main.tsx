import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Auto-recover seamlessly if a new deployment replaces hashed chunks
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const lastReload = parseInt(window.sessionStorage.getItem('chunk_reload_attempted') || '0', 10);
  if (Date.now() - lastReload > 10000) {
    window.sessionStorage.setItem('chunk_reload_attempted', String(Date.now()));
    const url = new URL(window.location.href);
    url.searchParams.set('v', String(Date.now()));
    window.location.replace(url.toString());
  }
});

createRoot(document.getElementById("root")!).render(<App />);
