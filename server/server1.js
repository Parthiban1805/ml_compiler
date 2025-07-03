// Backend (Express)
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { PythonShell } = require("python-shell");
const { execSync } = require("child_process");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));

// Question Schema
const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  testCases: [
    {
      input: { type: String, required: true },
      output: { type: String, required: true },
    },
  ],
});

const Question = mongoose.model("Question", questionSchema);

// API Endpoints

// Add a new question
app.post("/api/questions", async (req, res) => {
  const { title, description, testCases } = req.body;
  if (!title || !description || !testCases) {
    return res.status(400).json({ error: "All fields are required." });
  }
  try {
    const newQuestion = new Question({ title, description, testCases });
    await newQuestion.save();
    res.status(201).json({ message: "Question added successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add the question." });
  }
});

// Get all questions
app.get("/api/questions", async (req, res) => {
  try {
    const questions = await Question.find();
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch questions." });
  }
});

// Get a specific question by ID
app.get("/api/questions/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: "Question not found." });
    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch the question." });
  }
});

// Compile and execute code
app.post("/api/compile", async (req, res) => {
  const { language, code, input } = req.body;
  if (!language || !code) {
    return res.status(400).json({ error: "Language and code are required." });
  }

  const tempDir = path.join(__dirname, "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const codeFile = path.join(tempDir, `code.${getFileExtension(language)}`);
  fs.writeFileSync(codeFile, code);

  try {
    let result;
    if (language === "python") {
      const options = { args: [input] };
      result = await new Promise((resolve, reject) =>
        PythonShell.run(codeFile, options, (err, results) => {
          if (err) reject(err);
          else resolve(results.join("\n"));
        })
      );
    } else if (language === "c" || language === "cpp" || language === "java") {
      const outputFile = path.join(tempDir, "output");
      const compileCommand =
        language === "c"
          ? `gcc ${codeFile} -o ${outputFile}`
          : language === "cpp"
          ? `g++ ${codeFile} -o ${outputFile}`
          : `javac ${codeFile}`;
      execSync(compileCommand);
      const executionCommand =
        language === "java"
          ? `java -cp ${tempDir} ${path.basename(codeFile, ".java")}`
          : `${outputFile} < ${input}`;
      result = execSync(executionCommand).toString();
    } else {
      return res.status(400).json({ error: "Unsupported language." });
    }
    res.status(200).json({ output: result });
  } catch (err) {
    res.status(500).json({ error: "Failed to compile or execute code." });
  } finally {
    setTimeout(() => {
      fs.unlinkSync(codeFile);
      if (["c", "cpp", "java"].includes(language)) {
        const outputFile = path.join(tempDir, "output");
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      }
    }, 10000);
  }
});

// Helper function to get file extension
function getFileExtension(language) {
  return { python: "py", c: "c", cpp: "cpp", java: "java" }[language] || "txt";
}

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
