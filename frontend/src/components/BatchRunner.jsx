import React, { useState } from 'react';
import { Play, Download, Clock } from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000";

export default function BatchRunner() {
  const [testCases, setTestCases] = useState([]);
  const [results, setResults] = useState([]);
  const [provider, setProvider] = useState("groq");
  const [loading, setLoading] = useState(false);
  const [runningCount, setRunningCount] = useState(0);
  const [totalTime, setTotalTime] = useState(null);
  const [avgLatency, setAvgLatency] = useState(null);
  const [error, setError] = useState(null);

  const loadTestCases = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/test-cases`);
      if (!res.ok) throw new Error("Failed to fetch test cases");
      const data = await res.json();
      setTestCases(data);
      setResults([]);
      setTotalTime(null);
      setAvgLatency(null);
    } catch (err) {
      setError("Could not load test cases. Please ensure the backend is running.");
    }
  };

  const runBatch = async () => {
    if (testCases.length === 0) {
      setError("Please load test cases first.");
      return;
    }
    setLoading(true);
    setRunningCount(1);
    setError(null);

    const totalCases = testCases.length;
    const interval = setInterval(() => {
      setRunningCount(prev => {
        if (prev < totalCases) {
          return prev + 1;
        }
        return prev;
      });
    }, 1650);

    try {
      const messages = testCases.map(tc => 
        typeof tc.payload === 'object' ? JSON.stringify(tc.payload) : tc.payload
      );

      const res = await fetch(`${API_BASE}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, provider })
      });

      if (!res.ok) throw new Error("Batch run failed");
      const data = await res.json();
      
      clearInterval(interval);
      setRunningCount(totalCases);

      setResults(data.results);
      setTotalTime(data.latency_ms);

      const valids = data.results.filter(r => r.success);
      if (valids.length > 0) {
        const sum = valids.reduce((acc, curr) => acc + curr.latency_ms, 0);
        setAvgLatency(Math.round(sum / valids.length));
      }
    } catch (err) {
      clearInterval(interval);
      setError("Error executing batch: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'P0': return 'border-red-500 text-red-700 bg-red-50';
      case 'P1': return 'border-orange-500 text-orange-750 bg-orange-50';
      case 'P2': return 'border-blue-500 text-blue-700 bg-blue-50';
      case 'P3': return 'border-gray-400 text-gray-700 bg-gray-50';
      default: return 'border-gray-300 text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded p-4 text-gray-900 flex flex-col space-y-4 w-full" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className="flex flex-wrap gap-3 items-center justify-between pb-3 border-b border-gray-150">
        <span className="text-xs font-bold tracking-wider uppercase text-gray-500">
          Batch Processor Action Matrix
        </span>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-semibold">LLM:</span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="bg-[#ffffff] border border-[#e5e7eb] text-xs text-[#111111] px-2 py-1.5 rounded focus:outline-none focus:border-[#111111] font-semibold cursor-pointer"
            >
              <option value="groq">Groq (llama-3.3)</option>
              <option value="ollama">Ollama (gpt-oss)</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={loadTestCases}
              disabled={loading}
              className="flex items-center space-x-1.5 bg-white border border-gray-350 hover:bg-gray-50 disabled:opacity-40 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Load Test Cases</span>
            </button>
            <button
              onClick={runBatch}
              disabled={loading || testCases.length === 0}
              className="flex items-center space-x-1.5 bg-black hover:bg-gray-800 text-white disabled:opacity-40 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run All {testCases.length || 40}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-750 text-xs font-mono">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-xs font-semibold text-gray-500 flex flex-col space-y-1">
          <div>Running {runningCount}/{testCases.length}...</div>
          <div className="text-gray-400 font-normal">
            Estimated time remaining: ~{Math.max(0, Math.round((testCases.length - runningCount) * 1.65))}s (~60s for full batch)
          </div>
        </div>
      )}

      {testCases.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded max-h-[350px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-gray-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3 font-semibold">#</th>
                <th className="py-2.5 px-3 font-semibold">Preview</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold">Priority</th>
                <th className="py-2.5 px-3 font-semibold">Human?</th>
                <th className="py-2.5 px-3 font-semibold">Confidence</th>
                <th className="py-2.5 px-3 text-right font-semibold">ms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 font-sans">
              {testCases.map((tc, idx) => {
                const res = results[idx];
                const preview = (typeof tc.payload === 'object' ? JSON.stringify(tc.payload) : tc.payload).substring(0, 50) + "...";
                
                return (
                  <tr key={tc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3 text-gray-500 font-mono">{tc.id}</td>
                    <td className="py-2.5 px-3 text-gray-800">{preview}</td>
                    
                    {res ? (
                      res.success ? (
                        <>
                          <td className="py-2.5 px-3 capitalize font-bold text-gray-900">
                            {res.decision.category.replace('_', ' ')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadgeClass(res.decision.priority)}`}>
                              {res.decision.priority}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${res.decision.needs_human ? 'border-amber-500 text-amber-700 bg-amber-50' : 'border-gray-200 text-gray-500 bg-gray-50'}`}>
                              {res.decision.needs_human ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-gray-900">
                            {(typeof res.decision.confidence === 'number' && !isNaN(res.decision.confidence)) ? (res.decision.confidence * 100).toFixed(0) + "%" : "0%"}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-650 font-mono">
                            {res.latency_ms}
                          </td>
                        </>
                      ) : (
                        <td colSpan="5" className="py-2.5 px-3 text-red-650 italic text-left">
                          Failed: {res.error}
                        </td>
                      )
                    ) : (
                      <>
                        <td className="py-2.5 px-3 text-gray-400">-</td>
                        <td className="py-2.5 px-3 text-gray-400">-</td>
                        <td className="py-2.5 px-3 text-gray-400">-</td>
                        <td className="py-2.5 px-3 text-gray-400">-</td>
                        <td className="py-2.5 px-3 text-right text-gray-400">-</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {results.length > 0 && (
        <div className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200 text-xs text-gray-600">
          <div className="flex items-center space-x-1.5">
            <Clock className="h-4 w-4 text-gray-600" />
            <span>Total Execution Time: <strong className="text-gray-900">{totalTime} ms</strong></span>
          </div>
          <div>
            <span>Average Latency: <strong className="text-gray-900 font-mono">{avgLatency} ms/msg</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
