// src/components/CodeEditorPanel.jsx
import Editor from '@monaco-editor/react';

const CodeEditorPanel = ({ code, setCode, onRun, isLoading }) => {
  // The onChange handler for Monaco Editor provides the value directly
  const handleEditorChange = (value) => {
    setCode(value);
  };

  return (
    <div className="bg-white p-2 h-full rounded-lg shadow-sm border border-slate-200 flex flex-col">
      <div className="p-4 border-slate-200">
        <span className="text-slate-600">Python</span>
      </div>
      <div className="px-4">
        <Editor
          height="50vh"
          language="python"
          theme="vs-dark" // A standard, clean theme
          value={code}
          onChange={handleEditorChange}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="text-slate-700 font-semibold mb-2">Custom Input (Optional)</h3>
        <textarea
          className="w-full p-2 border border-slate-300 rounded-md h-24 text-sm bg-slate-50"
          placeholder="For this problem, custom input is not used. The script should run without it."
          disabled
        ></textarea>
      </div>
      <div className="p-4">
        <button
          onClick={onRun}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Running...' : 'Compile & Run'}
        </button>
      </div>
    </div>
  );
};

export default CodeEditorPanel;