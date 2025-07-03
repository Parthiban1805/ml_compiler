// seed.js
// This script connects to MongoDB and inserts the definitive, corrected version
// of the web scraper question. Run this file once with `node seed.js`.

const mongoose = require('mongoose');

// --- 1. CONFIGURATION ---
const MONGO_URI = 'mongodb+srv://parthis1805:Parthiban1805@cluster0.bxpradx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// --- 2. MONGOOSE SCHEMA DEFINITION ---
const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['standard', 'file-io'],
    default: 'standard',
  },
  codeTemplate: { type: String },
  testCases: [
    {
      input: { type: String },
      output: { type: String, required: true },
      expectedFileName: { type: String },
    },
  ],
});

const Question = mongoose.model('Question', questionSchema);


// --- 3. THE CORRECT QUESTION DATA ---
// THIS IS THE CORRECT VERSION OF THE QUESTION DATA
const webScraperQuestion = {
  title: "Web Scraper for Book Prices",
  description: "An online price comparison company wants to track the titles, prices, and availability of books from a sample e-commerce website to compare market trends. You have been asked to scrape this data from http://books.toscrape.com/.\n________________________________________\nAssessment Question\nWrite a Python script to scrape data from http://books.toscrape.com/catalogue/page-1.html. Your program must:\n1. Extract the title, price, and availability of each book listed on the page.\n2. Store the data in a CSV file named books_output.csv.\n3. Use requests and BeautifulSoup libraries only (no Selenium).\n4. Ensure your script handles at least 20 books.",
  questionType: "file-io",
  codeTemplate: "import requests\nfrom bs4 import BeautifulSoup\nimport csv\n\n# The required URL for the assessment\nURL = 'http://books.toscrape.com/catalogue/page-1.html'\nCSV_FILENAME = 'books_output.csv'\n\n# Your code here...\n\n# A simple open() command like this should work.\n# with open(CSV_FILENAME, 'w', newline='') as f:\n#    # ... your logic\n",
  testCases: [
    {
      expectedFileName: "books_output.csv",
      // THIS IS THE CORRECTED OUTPUT STRING FOR PAGE 1
      output: `Title,Price,Availability
A Light in the Attic,£51.77,In stock
Tipping the Velvet,£53.74,In stock
Soumission,£50.10,In stock
Sharp Objects,£47.82,In stock
Sapiens: A Brief History of Humankind,£54.23,In stock
The Requiem Red,£22.65,In stock
The Dirty Little Secrets of Getting Your Dream Job,£33.34,In stock
"The Coming Woman: A Novel Based on the Life of the Infamous Feminist, Victoria Woodhull",£17.93,In stock
The Boys in the Boat: Nine Americans and Their Epic Quest for Gold at the 1936 Berlin Olympics,£22.60,In stock
The Black Maria,£52.15,In stock
"Starving Hearts (Triangular Trade Trilogy, #1)",£13.99,In stock
Shakespeare's Sonnets,£20.66,In stock
Set Me Free,£17.46,In stock
"Scott Pilgrim's Precious Little Life (Scott Pilgrim #1)",£52.29,In stock
Rip it Up and Start Again,£35.02,In stock
Our Endless Numbered Days,£22.65,In stock
Olio,£23.88,In stock
Meserole Avenue,£52.87,In stock
Libertarianism for Beginners,£51.33,In stock
It's Only the Himalayas,£45.17,In stock`
    }
  ]
};


// --- 4. THE SEEDER FUNCTION ---
const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Successfully connected to MongoDB.');

    // We will find and update the question, or create it if it doesn't exist.
    // This is safer than just creating.
    const updatedQuestion = await Question.findOneAndUpdate(
      { title: webScraperQuestion.title }, // find a document with this title
      webScraperQuestion, // apply this data
      { new: true, upsert: true } // options: return the new doc, and create if it doesn't exist
    );
    
    console.log('Successfully upserted the "Web Scraper for Book Prices" question!');
    console.log('Database now contains the correct test case for page-1.html.');

  } catch (error) {
    console.error('Error seeding the database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

// --- 5. RUN THE SCRIPT ---
seedDatabase();