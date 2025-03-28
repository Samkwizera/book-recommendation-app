import requests
import os
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
OPEN_LIBRARY_URL = "https://openlibrary.org/search.json"
GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"
GOOGLE_BOOKS_API_KEY = os.getenv('GOOGLE_BOOKS_API_KEY')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/search', methods=['GET'])
def search_books():
    query = request.args.get('q')
    source = request.args.get('source', 'openlib')
    
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400

    if source == 'google':
        return search_google_books(query)
    else:
        return search_open_library(query)

def search_google_books(query):
    if not GOOGLE_BOOKS_API_KEY:
        return jsonify({"error": "Google Books API not configured"}), 503
        
    try:
        params = {
            'q': query,
            'key': GOOGLE_BOOKS_API_KEY,
            'maxResults': 10,
            'langRestrict': 'en'
        }
        response = requests.get(GOOGLE_BOOKS_URL, params=params, timeout=10)
        response.raise_for_status()
        
        books = []
        for item in response.json().get('items', []):
            info = item.get('volumeInfo', {})
            books.append({
                'title': info.get('title', 'No Title'),
                'author': ', '.join(info.get('authors', ['Unknown'])),
                'year': info.get('publishedDate', 'N/A')[:4],
                'thumbnail': info.get('imageLinks', {}).get('thumbnail', ''),
                'source': 'Google Books',
                'url': info.get('previewLink') or info.get('infoLink', '#')
            })
        
        return jsonify({"books": books})
        
    except Exception as e:
        return jsonify({"error": f"Google Books API error: {str(e)}"}), 502

def search_open_library(query):
    try:
        params = {
            'q': query,
            'limit': 10,
            'fields': 'title,author_name,first_publish_year,cover_i,key'
        }
        response = requests.get(OPEN_LIBRARY_URL, params=params, timeout=10)
        response.raise_for_status()
        
        books = []
        for book in response.json().get('docs', []):
            books.append({
                'title': book.get('title', 'No Title'),
                'author': ', '.join(book.get('author_name', ['Unknown'])),
                'year': book.get('first_publish_year', 'N/A'),
                'cover_id': book.get('cover_i'),
                'source': 'Open Library',
                'url': f"https://openlibrary.org{book.get('key', '')}" if book.get('key') else '#'
            })
        
        return jsonify({"books": books})
        
    except Exception as e:
        return jsonify({"error": f"Open Library API error: {str(e)}"}), 502

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=os.getenv('FLASK_DEBUG') == 'true')