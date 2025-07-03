// src/App.jsx
import axios from 'axios';
import { useEffect, useState } from 'react';
import CodeEditorPanel from './components/CodeEditorPanel';
import OutputDisplayPanel from './components/OutputDisplayPanel';
import QuestionPanel from './components/QuestionPanel';
import TestCasePanel from './components/TestCasePanel';
import './App.css'

// --- CHANGE THIS TO '3' TO TEST THE NEW QUESTION ---
const CURRENT_QUESTION_ID = '2'; 
const API_URL = 'http://127.0.0.1:5000';

// A default starting code template for the regression problem
const initialCode = `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

# You must define this function
def predict_prices(train_data_path, test_features):
    """
    Trains a model on data from train_data_path and
    predicts prices for the given test_features DataFrame.
    
    Args:
        train_data_path (str): The path to the training CSV file ('house_prices.csv').
        test_features (pd.DataFrame): A DataFrame with 'Size' and 'Bedrooms'
                                      columns for which to predict prices.

    Returns:
        A NumPy array of predicted prices.
    """
    # Load the dataset
    data = pd.read_csv(train_data_path)
    
    # Define features (X) and target (y)
    features = ['Size', 'Bedrooms']
    target = 'Price'
    X = data[features]
    y = data[target]
    
    # Initialize and train the model
    model = LinearRegression()
    model.fit(X, y)
    
    # Make predictions on the test set
    predictions = model.predict(test_features)
    
    return predictions

# This part is for your own testing if you run the script locally.
# The platform will only call your predict_prices function.
if __name__ == '__main__':
    # Example of how the platform will use your function
    df = pd.read_csv('server/data/house_prices.csv') # Adjust path for local testing
    X_train, X_test, y_train, y_test = train_test_split(
        df[['Size', 'Bedrooms']], df['Price'], test_size=0.2, random_state=42
    )
    
    predictions = predict_prices('server/data/house_prices.csv', X_test)
    print("Sample predictions:", predictions[:5])
`;

function App() {
  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState(initialCode);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [studentOutput, setStudentOutput] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/api/questions/${CURRENT_QUESTION_ID}`)
      .then(response => {
        setQuestion(response.data);
        // Reset code if the question changes (for a more advanced multi-question UI)
        // For now, we just set the initial code once.
        if (CURRENT_QUESTION_ID === '2') {
            setCode("# Your web scraping code here...\nimport requests\nfrom bs4 import BeautifulSoup\n\n");
        } else {
            setCode(initialCode);
        }
      })
      .catch(error => {
        console.error("Error fetching question:", error);
        setQuestion({ title: "Error", description: "Could not load question from backend." });
      });
  }, []); // Runs once on mount

  const handleRunCode = () => {
    setIsLoading(true);
    setResults(null);
    setStudentOutput('');
    setExpectedOutput('');

    axios.post(`${API_URL}/api/run`, {
      questionId: CURRENT_QUESTION_ID,
      code: code,
    })
    .then(response => {
      setResults(response.data);
      setStudentOutput(response.data.studentOutput || '');
      setExpectedOutput(response.data.expectedOutput || '');
    })
    .catch(error => {
      console.error("Error running code:", error);
      const errorMsg = error.response?.data?.error || error.message;
      setResults({
        stderr: `An error occurred: ${errorMsg}`,
        results: [{ testCase: 'System', status: 'error', details: 'Failed to communicate with the server.' }]
      });
    })
    .finally(() => setIsLoading(false));
  };

  if (!question) {
    return <div className="p-8 text-center text-slate-500">Loading Question...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Left Column */}
        <div className="flex flex-col gap-8">
          <QuestionPanel title={question.title} description={question.description} />
          <TestCasePanel results={results} isLoading={isLoading} />
          
          {/* --- Conditionally render the output panel --- */}
          {results && (studentOutput || expectedOutput) && (
            <OutputDisplayPanel 
              studentOutput={studentOutput}
              expectedOutput={expectedOutput}
            />
          )}
        </div>

        {/* Right Column */}
        <CodeEditorPanel
          code={code}
          setCode={setCode}
          onRun={handleRunCode}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}

export default App;