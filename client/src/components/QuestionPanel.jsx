import React from 'react';

const QuestionPanel = ({ title, description }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
      <hr className="my-4 border-blue-500 border-t-2 w-24" />
      <p className="text-slate-600 whitespace-pre-wrap">{description}</p>
    </div>
  );
};

export default QuestionPanel;