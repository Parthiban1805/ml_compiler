# server/app.py
import os
import sys
import uuid
import shutil
import subprocess
import pandas as pd
import csv
import json
import importlib.util
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

# --- Basic Flask App Setup ---
app = Flask(__name__)
CORS(app)

# --- Setup Directories ---
BASE_DIR = Path(__file__).resolve().parent
RUNS_DIR = BASE_DIR / "runs"
RUNS_DIR.mkdir(exist_ok=True)
SOLUTIONS_DIR = BASE_DIR / "solutions"
SOLUTIONS_DIR.mkdir(exist_ok=True)
QUESTIONS_DIR = BASE_DIR / "questions" # <-- NEW
QUESTIONS_DIR.mkdir(exist_ok=True)
DATA_DIR = BASE_DIR / "data" # <-- NEW
DATA_DIR.mkdir(exist_ok=True)


# --- Dynamic Question Loading ---
def load_questions():
    """Loads all question JSON files from the questions directory."""
    q_dict = {}
    for q_file in QUESTIONS_DIR.glob("*.json"):
        with open(q_file, 'r') as f:
            question_data = json.load(f)
            q_dict[question_data['id']] = question_data
    return q_dict

questions = load_questions()
print(f"Loaded {len(questions)} questions.")

# --- Generate Solution File for Question 2 (if not exists) ---
# (This part remains the same)
SOLUTION_FILE_PATH = SOLUTIONS_DIR / "solution_2.csv"
if '2' in questions and not SOLUTION_FILE_PATH.exists():
    # ... (code to generate solution_2.csv remains identical)
    # This code is omitted for brevity but should be kept from your original file.
    print("Generating solution file for Question 2...")
    import requests
    from bs4 import BeautifulSoup
    URL = "http://books.toscrape.com/catalogue/page-1.html"
    response = requests.get(URL)
    soup = BeautifulSoup(response.content, 'html.parser')
    books = soup.find_all('article', class_='product_pod')
    with open(SOLUTION_FILE_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Title', 'Price', 'Availability'])
        for book in books:
            title = book.h3.a['title']
            price = book.find('p', class_='price_color').text
            availability = book.find('p', class_='instock availability').text.strip()
            writer.writerow([title, price, availability])
    print("Solution file generated.")


# --- API Endpoints ---
@app.route('/api/questions/<question_id>', methods=['GET'])
def get_question(question_id):
    question = questions.get(question_id)
    if question:
        return jsonify(question)
    return jsonify({"error": "Question not found"}), 404

# --- Evaluation Functions ---

def check_csv_output(run_path, question_id):
    """Compares the student's output CSV with the expected CSV."""
    # (This function remains identical to your original file)
    # Omitted for brevity.
    question = questions.get(question_id)
    if not question or 'expected_output_file' not in question:
        return {"testCase": "Test Case 1", "status": "error", "details": "No solution file configured."}

    student_output_path = run_path / "books_output.csv"
    expected_output_path = SOLUTIONS_DIR / question['expected_output_file']

    if not student_output_path.exists():
        return [{"testCase": "File Exists", "status": "fail", "details": 'Output file "books_output.csv" not found.'}]
    
    try:
        student_df = pd.read_csv(student_output_path)
        expected_df = pd.read_csv(expected_output_path)
    except Exception as e:
        return [{"testCase": "CSV Format", "status": "fail", "details": f"Could not read or parse CSV file. Error: {e}"}]

    expected_cols = sorted(list(expected_df.columns))
    student_cols = sorted(list(student_df.columns))
    if expected_cols != student_cols:
        details = (f"Column headers do not match. "
                   f"Expected: {list(expected_df.columns)}, Got: {list(student_df.columns)}")
        return [{"testCase": "Columns", "status": "fail", "details": details}]

    if len(student_df) != len(expected_df):
        details = (f"Incorrect number of rows. "
                   f"Expected: {len(expected_df)}, Got: {len(student_df)}")
        return [{"testCase": "Row Count", "status": "fail", "details": details}]
        
    try:
        student_df_sorted = student_df.sort_values(by='Title').reset_index(drop=True)
        expected_df_sorted = expected_df.sort_values(by='Title').reset_index(drop=True)
    except KeyError:
        return [{"testCase": "Data Content", "status": "fail", "details": "Could not find 'Title' column to sort for comparison."}]

    if student_df_sorted.equals(expected_df_sorted):
        return [{"testCase": "Data Content", "status": "pass", "details": "Output is correct."}]
    else:
        details = "Data content does not match. Check for differences in prices, availability text, or titles."
        return [{"testCase": "Data Content", "status": "fail", "details": details}]


def check_regression_output(run_path, question_id):
    """
    Evaluates a linear regression script by checking MSE and R2 score.
    """
    question = questions.get(question_id)
    script_path = run_path / "script.py"
    solution_path = SOLUTIONS_DIR / question['solution_file']
    data_path = DATA_DIR / question['data_file']
    
    results = []

    # 1. Prepare data
    try:
        data = pd.read_csv(data_path)
        X = data[['Size', 'Bedrooms']]
        y = data['Price']
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        # The data file is now copied BEFORE this function is called, so this is no longer needed here.
        # shutil.copy(data_path, run_path) <--- REMOVE THIS LINE
    except Exception as e:
        return [{"testCase": "Setup", "status": "error", "details": f"Failed to prepare data: {e}"}]

    # 2. Dynamically import student's and solution's functions
    def import_fn_from_path(path, fn_name):
        spec = importlib.util.spec_from_file_location("module.name", path)
        module = importlib.util.module_from_spec(spec)
        sys.modules["module.name"] = module
        spec.loader.exec_module(module)
        return getattr(module, fn_name)

    try:
        student_predict_fn = import_fn_from_path(script_path, "predict_prices")
        solution_predict_fn = import_fn_from_path(solution_path, "predict_prices")
    except (AttributeError, ImportError, SyntaxError) as e:
        return [{"testCase": "Function Definition", "status": "fail", "details": f"Could not find or import `predict_prices` function. Error: {e}"}]
    except Exception as e:
        return [{"testCase": "Execution", "status": "error", "details": f"An error occurred running your script's structure: {e}"}]

    # 3. Get predictions
    try:
        # We pass the SIMPLE filename here, as it's now in the same directory
        student_predictions = student_predict_fn(str(run_path / question['data_file']), X_test)
        solution_predictions = solution_predict_fn(str(data_path), X_test)
    except Exception as e:
        return [{"testCase": "Function Execution", "status": "fail", "details": f"Your `predict_prices` function failed during execution. Error: {e}"}]

    # 4. Calculate and compare metrics
    solution_mse = mean_squared_error(y_test, solution_predictions)
    solution_r2 = r2_score(y_test, solution_predictions)
    student_mse = mean_squared_error(y_test, student_predictions)
    student_r2 = r2_score(y_test, student_predictions)

    # MSE Test Case
    # Allow for a small tolerance (e.g., 5% worse than solution)
    if student_mse <= solution_mse * 1.05:
        results.append({"testCase": "Mean Squared Error (MSE)", "status": "pass", "details": f"Your MSE ({student_mse:.2f}) is excellent."})
    else:
        results.append({"testCase": "Mean Squared Error (MSE)", "status": "fail", "details": f"Your MSE ({student_mse:.2f}) is too high. Expected close to {solution_mse:.2f}."})

    # R-squared Test Case
    # Must be at least 95% as good as the solution's R2, and positive.
    if student_r2 >= solution_r2 * 0.95 and student_r2 > 0:
        results.append({"testCase": "R-squared (R²)", "status": "pass", "details": f"Your R² score ({student_r2:.2f}) is excellent."})
    else:
        results.append({"testCase": "R-squared (R²)", "status": "fail", "details": f"Your R² score ({student_r2:.2f}) is too low. Expected close to {solution_r2:.2f}."})
        
    return results


@app.route('/api/run', methods=['POST'])
def run_code():
    data = request.get_json()
    code = data.get('code')
    question_id = data.get('questionId')
    question = questions.get(question_id)

    if not code or not question:
        return jsonify({"error": "Missing code or invalid question ID."}), 400

    run_id = str(uuid.uuid4())
    run_path = RUNS_DIR / run_id
    run_path.mkdir()

    script_path = run_path / "script.py"
    script_path.write_text(code, encoding='utf-8')

    results = []
    stdout, stderr = '', ''
    response_data = {}

    try:
        # Run student script to catch basic syntax errors and print statements
        if 'data_file' in question and (DATA_DIR / question['data_file']).exists():
            shutil.copy(DATA_DIR / question['data_file'], run_path)
        # --- END OF NEW LOGIC ---

        # Now, run the student script. It can now find 'house_prices.csv'.
        process = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True, text=True, timeout=30, cwd=run_path
        )
        stdout = process.stdout
        stderr = process.stderr
        
        if process.returncode != 0:
            results.append({"testCase": "Execution", "status": "fail", "details": "Your script failed to run. Check the console output for errors."})
        else:
            test_type = question.get("test_type")
            if test_type == "csv_comparison":
                results.extend(check_csv_output(run_path, question_id))
                # For CSV, we also return file contents for comparison
                student_output_path = run_path / "books_output.csv"
                expected_output_path = SOLUTIONS_DIR / question['expected_output_file']
                if student_output_path.exists():
                    response_data['studentOutput'] = student_output_path.read_text(encoding='utf-8')
                if expected_output_path.exists():
                    response_data['expectedOutput'] = expected_output_path.read_text(encoding='utf-8')

            elif test_type == "linear_regression":
                results = check_regression_output(run_path, question_id)
            else:
                results.append({"testCase": "Configuration", "status": "error", "details": "Unknown test type configured for this question."})

    except subprocess.TimeoutExpired:
        stderr = "Execution timed out after 30 seconds."
        results.append({"testCase": "Execution", "status": "fail", "details": "Code took too long to execute."})
    except Exception as e:
        stderr = f"A server-side error occurred during evaluation: {e}"
        results.append({"testCase": "Evaluation", "status": "error", "details": "Server-side execution error."})
    finally:
        shutil.rmtree(run_path)

    response_data.update({
        "stdout": stdout,
        "stderr": stderr,
        "results": results
    })
    return jsonify(response_data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)