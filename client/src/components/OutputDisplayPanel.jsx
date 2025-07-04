// src/components/OutputDisplayPanel.jsx
import React from 'react';

const OutputDisplayPanel = ({ studentOutput, expectedOutput }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your Output Column */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Your Output</h3>
          <pre className="bg-slate-100 p-4 rounded-md text-sm text-slate-700 h-64 overflow-auto whitespace-pre-wrap break-all">
            {studentOutput ? studentOutput : '<No output file generated>'}
          </pre>
        </div>
        
        {/* Expected Output Column */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Expected Output</h3>
          <pre className="bg-green-50 p-4 rounded-md text-sm text-green-800 h-64 overflow-auto whitespace-pre-wrap break-all">
            {expectedOutput ? expectedOutput : '<No solution file available>'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default OutputDisplayPanel;