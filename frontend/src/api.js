/**
 * Conduit Centralized API Layer
 *
 * Centralizes all communication with the Hugging Face ZeroGPU Gradio Space
 * or local Gradio instance via @gradio/client.
 *
 * Abstracting res.data[0] normalization and error handling so UI components
 * receive standard application data objects.
 */

import { Client } from "@gradio/client";
import { GRADIO_TARGET } from "./config";

let clientPromise = null;

/**
 * Obtains or creates the shared Gradio Client connection.
 * Caches the connection promise and resets on connection error.
 */
export async function getClient() {
  if (!clientPromise) {
    clientPromise = Client.connect(GRADIO_TARGET).catch((err) => {
      clientPromise = null; // Reset so retry can succeed
      const msg = err?.message || String(err);
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        throw new Error(
          `Unable to reach backend at ${GRADIO_TARGET}. The Space may be waking up from sleep (cold start). Please retry in 10-15 seconds.`
        );
      }
      throw new Error(`Backend connection error (${GRADIO_TARGET}): ${msg}`);
    });
  }
  return clientPromise;
}

/**
 * Normalizes any payload input (text, JSON object, string) to string for Gradio.
 */
function normalizePayload(payload) {
  if (payload == null) return "";
  if (typeof payload === "object") {
    try {
      return JSON.stringify(payload, null, 2);
    } catch {
      return String(payload);
    }
  }
  return String(payload);
}

/**
 * Triages a single ticket payload with provider selection.
 *
 * @param {string|object} payload - Support ticket message, JSON, or text
 * @param {string} provider - 'hybrid' | 'laya' | 'groq'
 * @returns {Promise<{decision: object, clean_text: string, latency_ms: number}>}
 */
export async function triageTicket(payload, provider = "hybrid") {
  const client = await getClient();
  const textMessage = normalizePayload(payload);

  try {
    const res = await client.predict("/triage", [textMessage, provider]);
    const data = res?.data?.[0];

    if (!data) {
      throw new Error("Received empty response from triage engine.");
    }
    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes("Queue is full") || msg.includes("exceeded")) {
      throw new Error("ZeroGPU compute queue is currently full. Please wait a moment and retry.");
    }
    throw err;
  }
}

/**
 * Loads the 40 test cases from the dataset endpoint.
 *
 * @returns {Promise<Array<{id: number, description: string, payload: any, expected: object}>>}
 */
export async function fetchTestCases() {
  const client = await getClient();
  try {
    const res = await client.predict("/test_cases", []);
    const data = res?.data?.[0];
    if (!Array.isArray(data)) {
      throw new Error("Invalid test cases format received from backend.");
    }
    return data;
  } catch (err) {
    throw new Error(`Failed to load test cases: ${err?.message || err}`);
  }
}

/**
 * Executes full evaluation suite against ground_truth.json.
 *
 * @param {string} provider - 'hybrid' | 'laya' | 'groq'
 * @returns {Promise<object>} EvalReport matching the evaluation view schema
 */
export async function runEvaluationSuite(provider = "hybrid") {
  const client = await getClient();
  try {
    const res = await client.predict("/evaluate", [provider]);
    const data = res?.data?.[0];

    if (!data) {
      throw new Error("Received empty response from evaluation engine.");
    }
    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes("ZeroGPU") || msg.includes("CUDA")) {
      throw new Error(`ZeroGPU evaluation error: ${msg}`);
    }
    throw err;
  }
}

/**
 * Fetches runtime engine status.
 *
 * @returns {Promise<{provider: string, groq_model: string, laya_available: boolean, laya_model: string, spaces_gpu_available: boolean}>}
 */
export async function getEngineInfo() {
  const client = await getClient();
  try {
    const res = await client.predict("/engine_info", []);
    return res?.data?.[0] || {};
  } catch (err) {
    return { error: err?.message || String(err) };
  }
}
