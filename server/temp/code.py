import requests
from bs4 import BeautifulSoup
import csv

# URL of the page to scrape
URL = "http://books.toscrape.com/catalogue/page-1.html"
CSV_FILENAME = "books_output.csv"

# Send GET request
response = requests.get(URL)
response.raise_for_status()  # Raise error for bad responses

# Parse the HTML content
soup = BeautifulSoup(response.text, "html.parser")

# Find all book containers
books = soup.find_all("article", class_="product_pod")

# List to store book data
book_data = []

for book in books:
    # Get title
    title = book.h3.a["title"]

    # Get price
    price = book.find("p", class_="price_color").text.strip()

    # Get availability
    availability = book.find("p", class_="instock availability").text.strip()

    # Append as a tuple
    book_data.append((title, price, availability))

# Write data to CSV
with open(CSV_FILENAME, mode="w", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["Title", "Price", "Availability"])  # Header
    writer.writerows(book_data)

print(f"✅ Scraped {len(book_data)} books and saved to '{CSV_FILENAME}'")
