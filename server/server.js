// server.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const { existsSync } = require("fs");
const levenshtein = require('fast-levenshtein');
const app = express();

app.use(express.json());
app.use(cors());

mongoose
  .connect('mongodb+srv://parthis1805:Parthiban1805@cluster0.bxpradx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));

// --- SCHEMA (no change) ---
const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['standard', 'file-io'],
    default: 'standard'
  },
  testCases: [
    {
      input: { type: String },
      output: { type: String, required: true },
      expectedFileName: { type: String },
    },
  ],
  codeTemplate: { type: String },
});

const Question = mongoose.model("Question", questionSchema);

// --- HELPER FUNCTIONS (no change) ---
function executeCode(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const executionOptions = {
            ...options,
            env: { ...process.env, PYTHONIOENCODING: 'UTF-8', PYTHONUTF8: '1' },
        };
        const childProcess = spawn(command, args, executionOptions);
        let output = "";
        let error = "";
        if (options.input) {
            childProcess.stdin.write(options.input);
            childProcess.stdin.end();
        }
        childProcess.stdout.on("data", (data) => (output += data.toString()));
        childProcess.stderr.on("data", (data) => (error += data.toString()));
        childProcess.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(error || `Process exited with code ${code}`));
            } else {
                resolve({ output, error });
            }
        });
        childProcess.on("error", (err) => reject(err));
    });
}

function calculateSimilarity(str1, str2) {
  const longerLength = Math.max(str1.length, str2.length);
  if (longerLength === 0) {
    return 100.0;
  }
  const distance = levenshtein.get(str1, str2);
  const similarity = (1 - distance / longerLength) * 100;
  return similarity;
}

// --- API ROUTES (no changes needed for GET/POST questions, /api/compile) ---
app.post("/api/questions", async (req, res) => {
  try {
    const newQuestion = new Question(req.body);
    await newQuestion.save();
    res.status(201).send({ message: "Question added successfully!" });
  } catch (error) {
    res.status(500).send({ error: "Failed to add the question." });
  }
});

app.get("/api/questions", async (req, res) => {
  try {
    const questions = await Question.find();
    res.status(200).send(questions);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch questions." });
  }
});

app.get("/api/questions/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).send({ error: "Question not found." });
    res.status(200).send(question);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch the question." });
  }
});
app.post("/api/compile", async (req, res) => {
  const { language, code, input } = req.body;
  if (language !== 'python') return res.status(400).send({ error: "This feature is currently configured for Python only."});
  const runDir = path.join(__dirname, 'temp_runs', `run_${Date.now()}`);
  const filePath = path.join(runDir, 'script.py');
  try {
    await fs.mkdir(runDir, { recursive: true });
    await fs.writeFile(filePath, code);
    const { output } = await executeCode('python', [filePath], { input });
    res.send({ output });
  } catch (err) {
    res.status(400).send({ error: err.message });
  } finally {
    if (existsSync(runDir)) await fs.rm(runDir, { recursive: true, force: true });
  }
});

// --- MODIFIED /api/run-tests ENDPOINT ---
app.post("/api/run-tests", async (req, res) => {
  const { questionId, language, code } = req.body;
  if (language !== 'python') return res.status(400).send({ error: "File-based testing is currently configured for Python only."});

  const runDir = path.join(__dirname, 'temp_runs', `run_${Date.now()}`);
  const filePath = path.join(runDir, 'script.py');
  let question;

  try {
    question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).send({ error: "Question not found." });
    }

    await fs.mkdir(runDir, { recursive: true });

    // --- START: COMPREHENSIVE ENCODING FIX ---
    // This new shim handles both file I/O and HTTP requests to ensure
    // UTF-8 is used consistently, fixing the root cause of the 'Â£' error.
    const pythonShim = `
import builtins
import functools
import requests

# --- Shim 1: Force UTF-8 for file open ---
# This remains as a safeguard for scripts that don't specify encoding.
original_open = builtins.open
@functools.wraps(original_open)
def utf8_open(file, mode='r', *args, **kwargs):
    if 'b' not in mode and 'encoding' not in kwargs:
        kwargs['encoding'] = 'utf-8'
    return original_open(file, mode, *args, **kwargs)
builtins.open = utf8_open

# --- Shim 2: Force UTF-8 for requests.get (The Key Fix) ---
# This fixes the issue where requests defaults to the wrong encoding.
original_get = requests.get
@functools.wraps(original_get)
def utf8_get(*args, **kwargs):
    response = original_get(*args, **kwargs)
    response.encoding = 'utf-8' # Force correct encoding
    return response
requests.get = utf8_get

# --- Original user code below this line ---
`;
    const codeToExecute = pythonShim + code;
    await fs.writeFile(filePath, codeToExecute);
    // --- END: COMPREHENSIVE ENCODING FIX ---

    await executeCode('python', [filePath], { cwd: runDir });

    const results = await Promise.all(question.testCases.map(async (testCase) => {
      const expectedFileName = testCase.expectedFileName;
      const generatedFilePath = path.join(runDir, expectedFileName);

      if (!existsSync(generatedFilePath)) {
        return { passed: false, notes: "File not created", expectedOutput: `A file named '${expectedFileName}' to be created.`, actualOutput: 'Error: File not found.' };
      }

      const actualContent = (await fs.readFile(generatedFilePath, 'utf-8')).trim().replace(/\r\n/g, '\n');
      const expectedContent = testCase.output.trim().replace(/\r\n/g, '\n');

      const similarity = calculateSimilarity(actualContent, expectedContent);
      // I also fixed the bug where the threshold was 88% but the message said 90%
      const passed = similarity >= 88;

      return {
        passed,
        notes: `Similarity: ${similarity.toFixed(2)}%`,
        expectedOutput: expectedContent,
        actualOutput: passed ? `Output meets the >88% similarity threshold.` : actualContent
      };
    }));

    res.send({ results });
  } catch (err) {
    if (question && question.testCases) {
      const results = question.testCases.map(() => ({ passed: false, notes: "Execution Failed", expectedOutput: "Successful execution.", actualOutput: `Execution Error: ${err.message}` }));
      res.status(200).send({ results });
    } else {
      res.status(400).send({ error: `Execution Error: ${err.message}` });
    }
  } finally {
    if (existsSync(runDir)) await fs.rm(runDir, { recursive: true, force: true });
  }
});
// ---

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});