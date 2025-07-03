// src/components/TestCasePanel.jsx
import React from 'react';
import { CheckCircle2, XCircle, Loader, AlertTriangle } from 'lucide-react';

const getStatusIcon = (status) => {
  // ... (this function remains the same as your original)
  switch (status) {
    case 'pass':
      return <CheckCircle2 className="text-green-500" />;
    case 'fail':
      return <XCircle className="text-red-500" />;
    case 'error':
      return <AlertTriangle className="text-yellow-500" />;
    default:
      return null;
  }
};

const TestCasePanel = ({ results, isLoading }) => {
  // Use results if available, otherwise show a placeholder.
  const testCases = results?.results;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-700 mb-4">Test Cases</h2>
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-3 text-slate-500 bg-slate-100 p-3 rounded-md">
            <Loader className="animate-spin" />
            <span>Running...</span>
          </div>
        ) : !testCases ? (
           // --- NEW: Better initial message ---
           <div className="text-slate-500 bg-slate-100/70 p-3 rounded-md">
             Click "Compile & Run" to see test results.
           </div>
        ) : (
          testCases.map((result, index) => (
            <div
              key={index}
              className="bg-slate-100/70 p-3 rounded-md"
            >
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium">{result.testCase}</span>
                {result.status && getStatusIcon(result.status)}
              </div>
              {result.details && (result.status === 'fail' || result.status === 'error') && (
                <p className="text-sm text-slate-600 mt-2">{result.details}</p>
              )}
            </div>
          ))
        )}
      </div>
      
      {results && (results.stderr || results.stdout) && (
        <div className="mt-6">
          <h3 className="font-semibold text-slate-700">Console Output:</h3>
          {results.stderr && <pre className="bg-red-50 text-red-700 p-3 mt-2 rounded-md text-sm whitespace-pre-wrap">{results.stderr}</pre>}
          {results.stdout && <pre className="bg-slate-100 text-slate-800 p-3 mt-2 rounded-md text-sm whitespace-pre-wrap">{results.stdout}</pre>}
        </div>
      )}
    </div>
  );
};

export default TestCasePanel;