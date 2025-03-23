import requests
import os
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv

# Load environment variables from .env if needed
load_dotenv()

app = Flask(__name__)

GOOGLE_BOOKS_API_KEY = os.getenv('AIzaSyDVf-xMoen84THJihaYdCJbKDVl27zCblI')

@app.route('/')
def home():
    """Render the home page with a search field."""
    return render_template('index.html')

@app.route('/search', methods=['GET'])
def search_books():
    """
    Searches books via the Open Library API based on a query (q).
    Example: GET /search?q=python
    Returns JSON with a list of books.
    """
    query = request.args.get('q')
    if not query:
        return jsonify({"error": "No query parameter provided"}), 400

    # Open Library search endpoint, e.g., https://openlibrary.org/search.json?q=python
    url = "https://openlibrary.org/search.json"
    params = {
        "q": query,
        "limit": 10  # Only fetch 10 results for this example
    }

    response = requests.get(url, params=params)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch data from Open Library"}), 502

    data = response.json()
    books = data.get("docs", [])

    # Transform the results into a simpler list of dicts
    results = []
    for b in books:
        results.append({
            "title": b.get("title", "No Title"),
            "author": ", ".join(b.get("author_name", ["Unknown"])),
            "first_publish_year": b.get("first_publish_year", "N/A"),
        })

    return jsonify({"books": results})

if __name__ == '__main__':
    # For local development (not for production)
    app.run(debug=True)
