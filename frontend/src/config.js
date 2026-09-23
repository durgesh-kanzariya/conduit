/**
 * Application Configuration
 *
 * In production (e.g. Vercel), connects to Hugging Face Space "durgesh-kanzariya/conduit-backend".
 * In local development, falls back to local Gradio server at "http://127.0.0.1:7860".
 * Can be overridden via VITE_GRADIO_SPACE or VITE_API_URL.
 */
export const GRADIO_TARGET =
  import.meta.env.VITE_GRADIO_SPACE ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:7860' : 'durgesh-kanzariya/conduit-backend');

// Legacy fallback for backward compatibility
export const API_BASE = GRADIO_TARGET;
