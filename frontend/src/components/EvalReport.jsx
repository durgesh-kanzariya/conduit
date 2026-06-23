import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Check, X } from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000";

export default function EvalReport() {
  const [report, setReport] = useState(null);
  const [provider, setProvider] = useState("groq");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runEvaluation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/evaluate?provider=${provider}`);
      if (!res.ok) throw new Error("Evaluation run failed");
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError("Could not complete evaluation: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAgreementRateColor = (rate) => {
    if (rate > 70) return 'text-emerald-650';
    if (rate >= 50) return 'text-amber-650';
    return 'text-red-700';
  };

  const getFailedCategoriesString = () => {
    if (!report || !report.failures || report.failures.length === 0) return 'None';
    const categories = report.failures.map(f => f.expected_category);
    const unique = [...new Set(categories)];
    return unique.join(', ');
  };

  return (
    <div className="bg-white border border-gray-200 rounded p-4 text-gray-900 flex flex-col space-y-4 w-full" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className="flex flex-wrap gap-3 items-center justify-between pb-3 border-b border-gray-150">
        <span className="text-xs font-bold tracking-wider uppercase text-gray-500">
          Evaluation Report Pipeline
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
          <button
            onClick={runEvaluation}
            disabled={loading}
            className="bg-black hover:bg-gray-800 text-white disabled:opacity-40 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors"
          >
            {loading ? 'Running...' : 'Run Evaluation'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-750 text-xs font-mono">
          {error}
        </div>
      )}

      {report && (
        <div className="flex flex-col space-y-5">
          <div className="flex flex-col items-center justify-center p-5 bg-gray-50 border border-gray-200 rounded">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Overall Agreement Rate</span>
            <div className={`text-5xl font-black font-mono mt-1 tracking-tight ${getAgreementRateColor(report.agreement_rate)}`}>
              {report.agreement_rate}%
            </div>
            <div className="text-[10px] text-gray-500 font-mono mt-2 flex items-center space-x-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Pipeline output matches ground truth targets</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded max-h-[400px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-semibold">ID</th>
                  <th className="py-2.5 px-3 font-semibold">Category (Exp / Got)</th>
                  <th className="py-2.5 px-3 font-semibold">Priority (Exp / Got)</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Needs Human (Exp / Got)</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 font-sans">
                {report.results.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3 text-gray-500 font-mono font-semibold">{res.id}</td>
                    
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-1.5">
                        <span className={`capitalize ${res.category_match ? 'text-gray-600' : 'text-red-650 font-semibold bg-red-50 border border-red-200 px-1 rounded'}`}>
                          {res.expected_category}
                        </span>
                        {!res.category_match && (
                          <>
                            <span className="text-gray-400">→</span>
                            <span className="text-red-700 font-bold capitalize">{res.got_category}</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-1.5">
                        <span className={`${res.priority_match ? 'text-gray-600' : 'text-red-650 font-semibold bg-red-50 border border-red-200 px-1 rounded'}`}>
                          {res.expected_priority}
                        </span>
                        {!res.priority_match && (
                          <>
                            <span className="text-gray-400">→</span>
                            <span className="text-red-700 font-bold">{res.got_priority}</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <span className={`${res.needs_human_match ? 'text-gray-600' : 'text-red-650 font-semibold bg-red-50 border border-red-200 px-1 rounded'}`}>
                          {res.expected_needs_human ? 'Yes' : 'No'}
                        </span>
                        {!res.needs_human_match && (
                          <>
                            <span className="text-gray-400">→</span>
                            <span className="text-red-700 font-bold">{res.got_needs_human ? 'Yes' : 'No'}</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {res.overall_pass ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-700">
                          <Check className="h-3 w-3 mr-0.5" /> Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-200 bg-red-50 text-red-700">
                          <X className="h-3 w-3 mr-0.5" /> Fail
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 p-3 rounded border border-gray-200 text-xs text-gray-600 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-gray-500 shrink-0" />
            <div>
              <span>{report.passed}/10 passed, failed on: <strong className="text-red-700">{getFailedCategoriesString()}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
