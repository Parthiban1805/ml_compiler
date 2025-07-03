import MonacoEditor from "@monaco-editor/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import './QuestionDetails.css';

const QuestionDetails = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [runError, setRunError] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('tests');

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/questions/${id}`);
        setQuestion(response.data);
        if (response.data.codeTemplate) {
          setCode(response.data.codeTemplate);
        } else if (response.data.questionType === 'file-io' && language === 'python') {
          setCode(`# Your Python script here
# The script should generate a file named '${response.data.testCases[0]?.expectedFileName || 'output.csv'}'

import requests
from bs4 import BeautifulSoup
import csv

# Your code goes here`);
        } else {
            setCode('');
        }
      } catch (err) {
        setError("Failed to fetch the question.");
        console.error("Error fetching question:", err);
      }
    };

    fetchQuestion();
  }, [id, language]);

  const handleSubmit = async () => {
    if (!code.trim()) {
      setRunError("Code cannot be empty.");
      setActiveTab('custom');
      return;
    }

    setIsSubmitting(true);
    setRunError("");
    setOutput("");
    setTestResults([]);
    
    const promises = [];

    if (input.trim()) {
        promises.push(
            axios.post("http://localhost:5000/api/compile", {
                language,
                code,
                input: input.trim(),
            }).then(response => ({ type: 'compile', data: response.data }))
        );
    }

    promises.push(
        axios.post("http://localhost:5000/api/run-tests", {
            questionId: id,
            language,
            code,
        }).then(response => ({ type: 'test-suite', data: response.data }))
    );

    try {
        const responses = await Promise.all(promises);
        
        const compileResult = responses.find(res => res.type === 'compile');
        if (compileResult) {
            setOutput(compileResult.data.output || "");
            if (compileResult.data.error) {
                setRunError(compileResult.data.error);
            }
        }

        const testSuiteResult = responses.find(res => res.type === 'test-suite');
        if (testSuiteResult) {
            setTestResults(testSuiteResult.data.results);
        }

        if (input.trim() && !testSuiteResult?.data?.results.some(r => !r.passed)) {
            setActiveTab('custom');
        } else {
            setActiveTab('tests');
        }

    } catch (err) {
        console.error("Submission error:", err);
        const errorMessage = err.response?.data?.error || "An unexpected error occurred during submission.";
        
        if (err.config.url.includes('run-tests')) {
            const failedResults = question.testCases.map((_, index) => ({
                passed: false,
                notes: `Test case ${index+1} did not run.`,
                actualOutput: `Submission Error: ${errorMessage}`,
                expectedOutput: question.testCases[index].output
            }));
            setTestResults(failedResults);
        } else {
            setRunError(errorMessage);
        }
        setActiveTab('tests');

    } finally {
        setIsSubmitting(false);
    }
  };

  if (error) return <div className="error-container">{error}</div>;
  if (!question) return <div className="loading-container">Loading...</div>;

  return (
    <div className="question-details-container">
      <div className="question-details-left-container">
        <div className="question-description-panel">
          <h1>{question.title}</h1>
          <p style={{ whiteSpace: 'pre-wrap' }}>{question.description}</p>
        </div>
        
        <div className="results-panel">
            <div className="tabs">
                <button className={activeTab === 'tests' ? 'active' : ''} onClick={() => setActiveTab('tests')}>
                    Test Cases ({testResults.filter(r => r.passed).length} / {question.testCases.length})
                </button>
                <button className={activeTab === 'custom' ? 'active' : ''} onClick={() => setActiveTab('custom')}>
                    Custom Run Output
                </button>
            </div>
            <div className="tab-content">
                {activeTab === 'tests' && (
                    <div className="test-case-results">
                    {question.testCases.map((testCase, index) => {
                      const result = testResults[index];
                      const status = result ? (result.passed ? 'passed' : 'failed') : 'pending';

                      return (
                        <div key={index} className={`test-case-item ${status}`}>
                          <div className="test-case-header">
                            <span className="test-case-number">Test Case {index + 1}</span>
                            {result && (
                              <span className={`status-badge ${status}`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            )}
                          </div>
                          {/* --- FIX: This condition is now changed to always show details when a result is available --- */}
                          {result && (
                            <div className="test-case-details">
                                {result.notes && (
                                    <div className="test-case-notes">
                                        <strong>Notes:</strong> {result.notes}
                                    </div>
                                )}
                                <div className="test-case-expected">
                                  <strong>Expected:</strong>
                                  <pre>{result.expectedOutput || testCase.output}</pre>
                                </div>
                                <div className="test-case-actual">
                                  <strong>Your Output:</strong>
                                  <pre>{result.actualOutput}</pre>
                                </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {activeTab === 'custom' && (
                    <div className="custom-output-panel">
                        {runError && (
                          <div className="error-message">
                            <h3>Run Error</h3>
                            <pre>{runError}</pre>
                          </div>
                        )}
                        {output && (
                          <div className="output-section">
                            <h3>Output for Custom Input</h3>
                            <pre className="output-pre">{output}</pre>
                          </div>
                        )}
                        {!isSubmitting && !runError && !output && (
                            <p>Provide custom input and click "Run & Submit" to see debug output here.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
  
      <div className="question-details-right-container">
        <div className="code-panel">
          <div className="code-header">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="language-dropdown"
              disabled
            >
              <option value="python">Python</option>
            </select>
          </div>
  
          <div className="monaco-editor-container">
            <MonacoEditor
              height="50vh"
              language={language}
              value={code}
              onChange={setCode}
              theme="vs-dark"
              options={{ minimap: { enabled: false } }}
            />
          </div>
  
          <div className="io-section">
            <div className="input-section">
              <label>Custom Input (for debugging with print)</label>
              <textarea
                placeholder="This input is for 'print' debugging, not for the test cases."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="input-textarea"
              />
            </div>
  
            <button 
              className={`submit-button ${isSubmitting ? 'compiling' : ''}`}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Running...' : 'Run & Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetails;