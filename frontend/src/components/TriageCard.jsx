import React from 'react';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function TriageCard({ result }) {
  if (!result || !result.decision) return null;
  const { category, priority, summary, suggested_action, needs_human, confidence } = result.decision;
  const latency = result.latency_ms;

  const priorityColors = {
    P0: 'border-red-500 text-red-650 bg-red-50',
    P1: 'border-orange-500 text-orange-650 bg-orange-50',
    P2: 'border-blue-500 text-blue-650 bg-blue-50',
    P3: 'border-gray-500 text-gray-650 bg-gray-50',
  };

  const priorityClass = priorityColors[priority] || 'border-gray-300 text-gray-700 bg-gray-50';

  return (
    <div className="bg-white border border-gray-200 rounded p-4 text-gray-900 flex flex-col space-y-4 w-full" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className="flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded text-xs font-semibold font-mono border ${priorityClass}`}>
          {priority}
        </span>
        <div className="text-xs font-semibold text-gray-600">
          Confidence: <span className="font-mono text-gray-900">{(typeof confidence === 'number' && !isNaN(confidence)) ? (confidence * 100).toFixed(0) + "%" : "0%"}</span>
        </div>
      </div>
      
      <div>
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">Category</span>
        <span className="text-sm font-bold block capitalize mt-0.5">{category ? category.replace('_', ' ') : 'N/A'}</span>
      </div>

      <div>
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">Summary</span>
        <p className="text-xs text-gray-800 mt-1 leading-relaxed">{summary}</p>
      </div>

      <div className="bg-gray-50 border border-gray-200 p-3 rounded">
        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold block">Suggested Action</span>
        <p className="text-xs text-gray-700 font-mono mt-1 leading-relaxed">{suggested_action}</p>
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
        <div className="flex items-center space-x-1.5">
          {needs_human ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs text-amber-700">Needs Human: Yes</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs text-gray-500">Needs Human: No</span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-1 text-gray-500 text-xs font-mono">
          <Clock className="h-3.5 w-3.5" />
          <span>{latency ? `${latency} ms` : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
