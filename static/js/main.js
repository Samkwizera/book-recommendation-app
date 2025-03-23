document.addEventListener('DOMContentLoaded', function() {
    const searchBtn = document.getElementById('searchBtn');
    const sortSelect = document.getElementById('sortSelect');
  
    searchBtn.addEventListener('click', fetchBooks);
    sortSelect.addEventListener('change', sortBooks);
  });
  
  let currentBooks = [];
  
  async function fetchBooks() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
      alert("Please enter a search query.");
      return;
    }
  
    
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = '<li>Loading results...</li>';
  
    try {
      const response = await fetch('/search?q=' + encodeURIComponent(query));
      const data = await response.json();
  
      if (data.error) {
        resultsList.innerHTML = `<li>Error: ${data.error}</li>`;
        return;
      }
  
      currentBooks = data.books || [];
      displayBooks(currentBooks);
    } catch (error) {
      console.error('Error fetching books:', error);
      resultsList.innerHTML = `<li>Something went wrong. Please try again later.</li>`;
    }
  }
  
  function displayBooks(books) {
    const list = document.getElementById('resultsList');
    list.innerHTML = '';
  
    if (books.length === 0) {
      list.innerHTML = '<li>No results found.</li>';
      return;
    }
  
    books.forEach(book => {
      const li = document.createElement('li');
  
    
      li.innerHTML = `
        <strong>${book.title}</strong>
        <em>by ${book.author}</em>
        <p>First Published: ${book.first_publish_year}</p>
      `;
  
      list.appendChild(li);
    });
  }
  
  function sortBooks() {
    const sortValue = document.getElementById('sortSelect').value;
    let sortedBooks = [...currentBooks];
  
    if (sortValue === 'title') {
      sortedBooks.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortValue === 'year') {
      sortedBooks.sort((a, b) => {
        let yearA = (a.first_publish_year === "N/A") ? Infinity : a.first_publish_year;
        let yearB = (b.first_publish_year === "N/A") ? Infinity : b.first_publish_year;
        return yearA - yearB;
      });
    }
    
    displayBooks(sortedBooks);
  }
  