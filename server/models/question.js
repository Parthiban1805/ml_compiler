// models/Question.js

const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  // The title of the coding challenge.
  title: {
    type: String,
    required: true
  },

  // The detailed problem description.
  description: {
    type: String,
    required: true
  },

  // Differentiates between standard I/O and file I/O problems.
  // 'standard': Compares stdin/stdout.
  // 'file-io': Checks for a generated file and compares its content.
  questionType: {
    type: String,
    enum: ['standard', 'file-io'],
    default: 'standard'
  },

  // A starter code template provided to the user.
  codeTemplate: {
    type: String
  },

  // An array of test cases to validate the user's solution.
  testCases: [
    {
      // (Optional) Standard input for 'standard' question types.
      input: {
        type: String
      },
      
      // Expected output. For 'standard' it's stdout.
      // For 'file-io', it's the complete expected content of the file.
      output: {
        type: String,
        required: true
      },

      // (Optional) The name of the file the user's script should create.
      // Used only for 'file-io' question types.
      expectedFileName: {
        type: String
      },
    },
  ],
});

module.exports = mongoose.model("Question", questionSchema);