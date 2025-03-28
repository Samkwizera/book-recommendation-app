document.addEventListener('DOMContentLoaded', function() {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const apiSourceSelect = document.getElementById('apiSource');
  const resultsList = document.getElementById('resultsList');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const noResultsDiv = document.getElementById('noResults');
  const resultCount = document.getElementById('resultCount');

  let currentBooks = [];

  searchBtn.addEventListener('click', fetchBooks);
  searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') fetchBooks();
  });
  sortSelect.addEventListener('change', sortBooks);
  apiSourceSelect.addEventListener('change', fetchBooks);

  async function fetchBooks() {
      const query = searchInput.value.trim();
      if (!query) {
          showError("Please enter a search term");
          return;
      }

      const apiSource = apiSourceSelect.value;
      showLoading(true);
      clearResults();

      try {
          const response = await fetch(`/search?q=${encodeURIComponent(query)}&source=${apiSource}`);
          
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "API request failed");
          }

          const data = await response.json();
          currentBooks = data.books || [];
          
          if (currentBooks.length === 0) {
              showNoResults();
          } else {
              displayBooks(currentBooks);
          }
          
          updateResultCount(currentBooks.length);
          
      } catch (error) {
          showError(getUserFriendlyError(error.message, apiSource));
      } finally {
          showLoading(false);
      }
  }

  function displayBooks(books) {
      resultsList.innerHTML = '';
      noResultsDiv.style.display = 'none';
      
      books.forEach(book => {
          const li = document.createElement('li');
          
          const coverImage = book.thumbnail 
              ? `<img src="${book.thumbnail}" alt="${book.title}" class="book-cover">`
              : book.cover_id 
                  ? `<img src="https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg" alt="${book.title}" class="book-cover">`
                  : '';
          
          li.innerHTML = `
              ${coverImage}
              <a href="${book.url}" target="_blank" rel="noopener noreferrer" class="book-title">
                  ${book.title}
              </a>
              <em>by ${book.author}</em>
              <p>First Published: ${book.year || book.first_publish_year || 'N/A'}</p>
              <span class="book-source source-${book.source.toLowerCase().replace(' ', '-')}">
                  ${book.source}
              </span>
          `;

          resultsList.appendChild(li);
      });
  }

  function sortBooks() {
      const sortValue = sortSelect.value;
      let sortedBooks = [...currentBooks];

      if (sortValue === 'title') {
          sortedBooks.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortValue === 'year') {
          sortedBooks.sort((a, b) => {
              const yearA = extractYear(a.year || a.first_publish_year);
              const yearB = extractYear(b.year || b.first_publish_year);
              return yearA - yearB;
          });
      }
      
      displayBooks(sortedBooks);
  }

  function extractYear(yearStr) {
      if (!yearStr || yearStr === 'N/A') return Infinity;
      const year = parseInt(yearStr.toString().substring(0, 4));
      return isNaN(year) ? Infinity : year;
  }

  function showLoading(show) {
      loadingIndicator.style.display = show ? 'block' : 'none';
      if (show) {
          resultsList.innerHTML = '';
          noResultsDiv.style.display = 'none';
      }
  }

  function showNoResults() {
      resultsList.innerHTML = '';
      noResultsDiv.style.display = 'block';
  }

  function clearResults() {
      resultsList.innerHTML = '';
      noResultsDiv.style.display = 'none';
  }

  function updateResultCount(count) {
      resultCount.textContent = count === 0 
          ? 'No results found' 
          : `Showing ${count} ${count === 1 ? 'result' : 'results'}`;
  }

  function showError(message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.innerHTML = `
          <i class="fas fa-exclamation-triangle"></i>
          <span>${message}</span>
          ${apiSourceSelect.value === 'google' ? '<p class="hint">Try switching to Open Library</p>' : ''}
      `;
      resultsList.appendChild(errorDiv);
  }

  function getUserFriendlyError(error, apiSource) {
      if (error.includes('not configured')) {
          return 'Google Books search is currently unavailable';
      }
      if (error.includes('API key')) {
          return 'Server configuration error - try again later';
      }
      return apiSource === 'google'
          ? 'Google Books search failed - try a different query'
          : 'Search failed - please try again';
  }
});