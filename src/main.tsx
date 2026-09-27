import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Auto-recover from stale chunks when a new deployment replaces hashed assets
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const lastReload = parseInt(window.sessionStorage.getItem('last_chunk_reload') || '0', 10);
  if (Date.now() - lastReload > 10000) {
    window.sessionStorage.setItem('last_chunk_reload', String(Date.now()));
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
