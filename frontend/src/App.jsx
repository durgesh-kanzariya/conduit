import React, { useState } from 'react';
import { Github } from 'lucide-react';
import TriageCard from './components/TriageCard';
import BatchRunner from './components/BatchRunner';
import EvalReport from './components/EvalReport';

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [inputPayload, setInputPayload] = useState("");
  const [format, setFormat] = useState("Auto");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRunTriage = async () => {
    if (!inputPayload.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    let headers = {};
    let body = "";

    if (format === "Auto") {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({ payload: inputPayload });
    } else if (format === "Text") {
      headers["Content-Type"] = "text/plain";
      body = inputPayload;
    } else if (format === "JSON") {
      headers["Content-Type"] = "application/json";
      try {
        JSON.parse(inputPayload);
        body = inputPayload;
      } catch (e) {
        body = JSON.stringify({ payload: inputPayload });
      }
    } else if (format === "HTML") {
      headers["Content-Type"] = "text/html";
      body = inputPayload;
    } else if (format === "CSV") {
      headers["Content-Type"] = "text/plain";
      body = inputPayload;
    }

    try {
      const res = await fetch(`${API_BASE}/triage`, {
        method: "POST",
        headers,
        body
      });
      if (!res.ok) throw new Error("Triage request failed");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#ffffff] min-h-screen text-[#111111] pb-12" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Centered Main Container */}
      <div className="max-w-[1200px] mx-auto px-6 pt-8 flex flex-col space-y-10">
        
        {/* Top nav bar */}
        <header className="flex items-center justify-between pb-6 border-b border-[#e5e7eb]">
          <div className="flex items-baseline space-x-2.5">
            <span className="font-bold text-[20px] tracking-tight text-[#111111]">Frontline</span>
            <span className="text-[14px] text-gray-500 font-medium">AI Triage System</span>
          </div>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center space-x-1.5 text-xs font-semibold text-[#111111] hover:text-gray-600"
          >
            <Github className="h-4 w-4" />
            <span>View on GitHub</span>
          </a>
        </header>

        {/* Single Message Triage Playground */}
        <section className="flex flex-col space-y-4 pb-10 border-b border-[#e5e7eb]">
          <h2 className="text-xs font-bold tracking-wider uppercase text-gray-500">
            Single Message Triage
          </h2>
          <div className="flex flex-col space-y-3">
            <textarea
              rows={4}
              value={inputPayload}
              onChange={(e) => setInputPayload(e.target.value)}
              placeholder="Paste any message..."
              className="w-full bg-[#ffffff] border border-[#e5e7eb] rounded p-3 text-sm text-[#111111] focus:outline-none focus:border-[#111111] resize-y placeholder-gray-400"
            />
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-semibold">Format:</span>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="bg-[#ffffff] border border-[#e5e7eb] text-xs text-[#111111] px-2 py-1.5 rounded focus:outline-none focus:border-[#111111] font-semibold cursor-pointer"
                >
                  <option value="Auto">Auto</option>
                  <option value="Text">Text</option>
                  <option value="JSON">JSON</option>
                  <option value="HTML">HTML</option>
                  <option value="CSV">CSV</option>
                </select>
              </div>
              <button
                onClick={handleRunTriage}
                disabled={loading || !inputPayload.trim()}
                className="bg-[#111111] hover:bg-gray-800 text-[#ffffff] text-xs font-semibold px-4 py-1.5 rounded disabled:opacity-40 cursor-pointer"
              >
                {loading ? "Running..." : "Run Triage"}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-750 text-xs font-mono">
              Error: {error}
            </div>
          )}

          {result && (
            <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              <TriageCard result={result} />
              <div className="bg-white border border-gray-200 rounded p-4">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-2">Raw JSON Response</span>
                <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">{JSON.stringify(result.decision, null, 2)}</pre>
              </div>
            </div>
          )}
        </section>

        {/* Batch section */}
        <section className="pb-10 border-b border-[#e5e7eb] flex flex-col space-y-4">
          <h2 className="text-xs font-bold tracking-wider uppercase text-gray-500">
            Batch Runner — 40 Test Cases
          </h2>
          <BatchRunner />
        </section>

        {/* Eval section */}
        <section className="pb-10 border-b border-[#e5e7eb] flex flex-col space-y-4">
          <h2 className="text-xs font-bold tracking-wider uppercase text-gray-500">
            Evaluation Report
          </h2>
          <EvalReport />
        </section>

        {/* Footer */}
        <footer className="text-center text-[11px] text-gray-400 font-medium pt-2">
          Built for Frontline Hackathon · Groq + Llama 3.3
        </footer>

      </div>
    </div>
  );
}

export default App;
