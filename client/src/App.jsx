import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import './App.css';
import AddQuestion from "./components/AddQuestion/AddQuestion";
import QuestionDetails from "./components/QuestionDetails/QuestionDetails";
import QuestionList from "./components/QuestionList/QuestionList";

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<QuestionList />} />
                <Route path="/question/:id" element={<QuestionDetails/>} />
                <Route path="/add-question" element={<AddQuestion />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;