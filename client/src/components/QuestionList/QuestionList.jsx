import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import './QuestionList.css';

const QuestionList = () => {
    const [questions, setQuestions] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/questions");
                setQuestions(response.data);
            } catch (err) {
                setError("Failed to fetch questions.");
            }
        };

        fetchQuestions();
    }, []);

    return (
        <div className="question-list-container">
            <h1>Question List</h1>
            <Link to="/add-question" className="add-question-link">Add New Question</Link>
            {error && <p className="error-message">{error}</p>}
            <ul className="question-list">
                {questions.map((question, index) => (
                    <li key={question._id} className="question-item">
                        <span className="question-number">{index + 1}.</span>
                        <Link to={`/question/${question._id}`} className="question-title-link">
                            {question.title}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default QuestionList;
