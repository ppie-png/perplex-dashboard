import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global fetch interceptor to automatically inject Authorization JWT header for "BIG systems" API security
const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === "string" 
    ? input 
    : input instanceof URL 
      ? input.href 
      : input.url;

  if (urlStr.startsWith("/api") && !urlStr.startsWith("/api/login") && !urlStr.startsWith("/api/register") && !urlStr.startsWith("/api/health")) {
    const cached = localStorage.getItem("craft_session");
    if (cached) {
      try {
        const session = JSON.parse(cached);
        if (session && session.token) {
          const headers = new Headers(init?.headers);
          headers.set("Authorization", `Bearer ${session.token}`);
          init = {
            ...init,
            headers
          };
        }
      } catch (e) {
        console.error("Fetch interceptor session parsing error:", e);
      }
    }
  }
  return originalFetch.call(this, input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
