import axios from "axios";
import React, { useState } from "react";
import './AddQuestion.css';

const AddQuestion = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [testCases, setTestCases] = useState([{ input: "", output: "" }]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleAddTestCase = () => {
        setTestCases([...testCases, { input: "", output: "" }]);
    };

    const handleTestCaseChange = (index, field, value) => {
        const newTestCases = [...testCases];
        newTestCases[index][field] = value;
        setTestCases(newTestCases);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:5000/api/questions", {
                title,
                description,
                testCases,
            });
            setSuccess(response.data.message);
            setError("");
            setTitle("");
            setDescription("");
            setTestCases([{ input: "", output: "" }]); // Reset test cases
        } catch (err) {
            setError(err.response.data.error);
            setSuccess("");
        }
    };

    return (
        <div className="question-container">
            <h1>Add a New Question</h1>
            <form className="question-form" onSubmit={handleSubmit}>
                <div className="question-form-element">
                    <label>Title:</label>
                    <input
                        className="input-field"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div className="question-form-element">
                    <label>Description:</label>
                    <textarea
                        className="textarea-field"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>
                <div className="test-case-section">
                    <h3>Test Cases</h3>
                    {testCases.map((testCase, index) => (
                        <div key={index} className="question-testcase-form-element">
                            <div className="question-form-element">
                                <label>Input:</label>
                                <input
                                    className="test-case-input"
                                    type="text"
                                    value={testCase.input}
                                    onChange={(e) => handleTestCaseChange(index, "input", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="question-form-element">
                                <label>Output:</label>
                                <input
                                    className="test-case-input"
                                    type="text"
                                    value={testCase.output}
                                    onChange={(e) => handleTestCaseChange(index, "output", e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    ))}
                    <button className="add-test-case-button" type="button" onClick={handleAddTestCase}>Add Test Case</button>
                </div>
                <button className="submit-button" type="submit">Add Question</button>
            </form>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
        </div>
    );
};

export default AddQuestion;
