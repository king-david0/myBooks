
document.addEventListener('DOMContentLoaded', () => {
  const postContent = document.getElementById("postContent");
  const mobilePostContent = document.getElementById('mobile-post');
  const mobileButton = document.getElementById("mobile-button")
  const addButton = document.getElementById('add-button');
  const navButton = document.getElementById('nav-button');
  const homeButton = document.getElementById('home-button');
  const sidebar = document.querySelector('.sidebar');
  const bookInput = document.getElementById('book-input');
  const bookSearch = document.getElementById('book-search');
  const loadingDots = document.getElementById("loading-dots");
  const bookMobile = document.getElementById('book-mobile')
  const mobileBook = document.querySelector('.mobile-book')
  const updateButton = document.querySelectorAll(".update-button")
  const deleteButton = document.querySelectorAll(".delete-button")
  const mobileBreakpoint = 1020; 


    // Initialize event listeners
    initializeEventListeners();

    function initializeEventListeners() {
      // if (postContent) {
      //   postContent.addEventListener("keydown", handlePostContentKeydown);
      // }
      if (navButton && sidebar) {
        navButton.addEventListener('click', handleNavButtonClick);
      }
  
      if (addButton) {
        addButton.addEventListener('click', handleAddButtonClick);
      }
  
      if (homeButton) {
        homeButton.addEventListener('click', handleHomeButtonClick);
      }
  
      if (bookInput) {
        bookInput.addEventListener('input', debounce(handleBookInput, 300));
      }
  
      if (bookSearch) {
        bookSearch.addEventListener('input', debounce(handleBookSearch, 300));
      }
  
      if(mobileButton){
        handleViewportChange();
        window.addEventListener('resize', handleViewportChange);
        }
      
    }
  

//to update a book
updateButton.forEach(button => {
  button.addEventListener("click", (e) => {
    const bookId = e.target.dataset.id;
    const reviewElement = document.querySelector(`.bookReview[id="${bookId}"] .book-review`);
    const deleteButton = document.querySelector(`.delete-button`);

    if (!reviewElement) {
      console.error("Review element not found.");
      return;
    }

    // If an edit textarea already exists, do nothing
    if (document.querySelector(`.bookReview[id="${bookId}"] .review-edit-textarea`)) {
      return;
    }

    // Hide the delete button and change update button text
    if (deleteButton) {
      deleteButton.style.display = 'none';
    }
    e.target.textContent = 'Submit Review';
    
    const textarea = document.createElement('textarea');
    textarea.classList.add('review-edit-textarea');
    textarea.value = reviewElement.textContent;

    reviewElement.parentNode.replaceChild(textarea, reviewElement);
    textarea.focus();

    // Handle the blur event of the textarea for submission
    textarea.addEventListener('blur', function () {
      const newReview = textarea.value.trim();

      if (newReview === reviewElement.textContent) {
        textarea.parentNode.replaceChild(reviewElement, textarea);
        // Restore the button text and show the delete button
        e.target.textContent = 'Update Review';
        if (deleteButton) {
          deleteButton.style.display = 'block';
        }
        return;
      }

      // Send PATCH request using Axios
      axios.patch(`/books/update/${bookId}`, { review: newReview })
        .then(response => {
          if (response.data.success) {
            reviewElement.textContent = newReview;
            textarea.parentNode.replaceChild(reviewElement, textarea);
          } else {
            alert('Failed to update review');
            textarea.parentNode.replaceChild(reviewElement, textarea);
          }
          // Restore the button text and show the delete button
          e.target.textContent = 'Update Review';
          if (deleteButton) {
            deleteButton.style.display = 'block';
          }
        })
        .catch(() => {
          alert('Error updating review');
          textarea.parentNode.replaceChild(reviewElement, textarea);
          // Restore the button text and show the delete button
          e.target.textContent = 'Update Review';
          if (deleteButton) {
            deleteButton.style.display = 'block';
          }
        });
    });

  });
});

// to delete a book
deleteButton.forEach(button => {
  button.addEventListener("click", (e) => {
    const bookId = e.target.dataset.id;

    if (!confirm("Are you sure you want to delete this book?")) {
      return;
    }

    // Send DELETE request using Axios
    axios.delete(`/books/delete/${bookId}`)
      .then(response => {
        if (response.data.success) {
          window.location.href = '/'; 
        } else {
          alert('Failed to delete book');
        }
      })
      .catch(() => {
        alert('Error deleting book');
      });
  });
});


  // Function to automatically resize the textarea
if(mobilePostContent){
function autoResize(textarea) {
  textarea.style.height = 'auto'; 
  const newHeight = Math.min(textarea.scrollHeight, 150) + 'px'; 
  textarea.style.height = newHeight;
}

const textarea = document.getElementById('mobile-post');
autoResize(textarea)
const observer = new MutationObserver(() => {
  autoResize(textarea);
});

observer.observe(textarea, {
  childList: true,
  subtree: true,
  characterData: true
});

textarea.addEventListener('input', () => {
  autoResize(textarea);
}, { passive: true });
}


  // Function to handle viewport changes for mobile vs desktop
  function handleViewportChange() {
    const viewportWidth = window.innerWidth;

    if (viewportWidth < mobileBreakpoint) {
      mobileButton.addEventListener('click', handleButtonSubmit);
    } else {
      postContent.addEventListener('keydown', handlePostContentKeydown);
    }
  }

  // Handle pressing Enter in post content field
  function handlePostContentKeydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      submitPostContent();
    }
  }


  function handleButtonSubmit() {
    submitPostContent();
  }

  // Function to submit the post content
  async function submitPostContent() {
    const viewportWidth = window.innerWidth;
    const postContentValue = viewportWidth < mobileBreakpoint ? mobilePostContent.value.trim() : postContent.value.trim();

    const postData = {
      postContent: postContentValue,
      selectedThumbnail: getAttributeById('book-thumbnail', 'src'),
      authorImage: getAttributeById('author-thumbnail', 'src'),
      selectedAuthor: getTextById('book-author'),
      selectedTitle: getTextById('book-title'),
      selectedDate: getTextById('book-published-date')
    };
    if (postData.selectedThumbnail && postContentValue.length > 100) {
      try {
        const response = await axios.post("/submit-review", postData);
        if (response.data.success) {
          window.location.href = '/';
          // alert("success")
        } else {
          window.location.href = '/addError';
        }
      } catch (error) {
        console.error("Error submitting post:", error);
      }
    } else {
      console.log("No image selected or post content is too short.");
      window.location.href = '/addErrorNoImage';
    }
  }

  // Function to handle opening the sidebar navigation
  async function handleNavButtonClick() {
    sidebar.classList.toggle('show');
    try {
      const response = await axios.get('/nav/books');
      const books = response.data.items || [];
      displayBooksByDate(books);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  }

  function handleAddButtonClick() {
    window.location.href = '/add';
  }

  function handleHomeButtonClick() {
    window.location.href = '/';
  }

  function handleBookInput(e) {
    loadingDots.classList.remove("hidden");
    // Simulate a delay for loading (e.g., waiting for API call)
    setTimeout(() => {
      loadingDots.classList.add("hidden"); // Hide dots after loading
    }, 2000); 
    const query = e.target.value;
    if (query.length > 2) {
      fetchBooks(query);
    } else {
      clearSuggestions();
    }
  }

  function handleBookSearch(e) {
    loadingDots.classList.remove("hidden");
    // Simulate a delay for loading (e.g., waiting for API call)
    setTimeout(() => {
      loadingDots.classList.add("hidden"); // Hide dots after loading
    }, 2000); 
    const query = e.target.value;
    if (query.length > 2) {
      searchBooks(query);
    } else {
      clearSuggestions();
    }
  }

  async function searchBooks(query) {
    try {
      const response = await axios.get('/database/books', { params: { query } });
      displayBooks(response.data.items || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      clearSuggestions();
    }
  }

  async function fetchBooks(query) {
    try {
      const response = await axios.get('/searchAPI/books', { params: { query } });
      displaySuggestions(response.data.items || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      clearSuggestions();
    }
  }

  function displayBooksByDate(books) {
    const container = document.getElementById('books-container');
    container.innerHTML = ''; // Clear previous content
    const groupedBooks = groupBooksByDate(books);

    Object.keys(groupedBooks).forEach(dateLabel => {
      const section = document.createElement('div');
      const dateHeader = document.createElement('h3');
      dateHeader.textContent = dateLabel;
      section.appendChild(dateHeader);

      const list = document.createElement('ul');
      groupedBooks[dateLabel].forEach(book => {
        const listItem = document.createElement('li');
        listItem.id = book.id;
        listItem.textContent = book.title;
        list.appendChild(listItem);
        // Add click event listener
        listItem.addEventListener('click', () => {
          handleBookClick(book.id);  // Call the function to handle click
        });
  
        list.appendChild(listItem);
      });

      section.appendChild(list);
      container.appendChild(section);
    });
  }

  function handleBookClick(bookId) {
    window.location.href = `/books/${bookId}`;
  }

  function displaySuggestions(books) {
    const suggestionsDiv = document.getElementById('suggestions');
    clearSuggestions();

    books.forEach(book => {
      const suggestion = document.createElement('div');
      suggestion.classList.add('suggestion');

      const bookThumbnail = book.thumbnail !== 'No image available' ? book.thumbnail : 'images/image-regular.svg';
      const bookTitle = book.title || 'Unknown Title';
      const bookAuthors = book.authors && book.authors.length > 0 ? book.authors.join(', ') : 'Unknown Author';
      const bookPublishedDate = book.publishedDate !== 'No date available' ? book.publishedDate : 'Unknown Date';
      const bookDescription = book.description || 'No description available.';


      const bookDetails = `
        <div>
          <img src="${bookThumbnail}" alt="${bookTitle}" />
          <div>
            <h3>${bookTitle}</h3>
            <p>${bookAuthors}</p>
            <p>${bookPublishedDate}</p>
            <p class="description">${bookDescription}</p>
          </div>
        </div>
      `;
      suggestion.innerHTML = bookDetails;

      suggestion.addEventListener('click', () => {
        document.getElementById('book-thumbnail').src = bookThumbnail;
        document.getElementById('book-title').textContent = bookTitle;
        document.getElementById('book-author').textContent = bookAuthors;
        document.getElementById('book-published-date').textContent = bookPublishedDate;
        document.getElementById('mobile-book-thumbnail').src = bookThumbnail;
        document.getElementById('mobile-book-title').textContent = bookTitle;
        document.getElementById('mobile-book-author').textContent = bookAuthors;
        document.getElementById('mobile-book-published-date').textContent = bookPublishedDate;
        toggle();
        clearSuggestions(); // Clear suggestions after selection
      });

      suggestionsDiv.appendChild(suggestion);
    });
  }
  function toggle() {
    if (bookMobile.classList.contains('book-mobile')) {
      bookMobile.classList.remove('book-mobile')
      bookMobile.classList.add('show-book');
    }
    if (mobileBook) {
      mobileBook.classList.toggle('hide-mobile-book');
    }
  }

  function clearSuggestions() {
    document.getElementById('suggestions').innerHTML = '';
    if(bookInput){
      bookInput.innerHTML = ''
    }
  }

  function groupBooksByDate(books) {
    const grouped = {};
    
    books.forEach(book => {
      const date = new Date(book.dateUploaded);
      const today = new Date();
      const timeDiff = today - date;
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
      let dateLabel;
      if (daysDiff === 0) {
        dateLabel = 'Today';
      } else if (daysDiff === 1) {
        dateLabel = 'Yesterday';
      }else if (daysDiff <=7){
         dateLabel = 'this week'
      } else {
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 0);
      
        if (date >= firstOfMonth) {
          dateLabel = 'This Month';
        } else if (date >= firstOfLastMonth && date <= lastMonth) {
          dateLabel = 'Last Month';
        } else if (date.getFullYear() === today.getFullYear()) {
          // Return month name if within this year
          const monthName = date.toLocaleString('default', { month: 'long' });
          dateLabel = monthName;
        } else {
          // Return year if date is not within this year
          const year = date.getFullYear();
          dateLabel = year.toString();
        }
      }

      if (!grouped[dateLabel]) {
        grouped[dateLabel] = [];
      }
      grouped[dateLabel].push(book);
    });

    return grouped;
  }


  function displayBooks(books) {
    const suggestionsDiv = document.getElementById('suggestions');
    clearSuggestions();

    books.forEach(book => {
      const suggestion = document.createElement('div');
      suggestion.classList.add('searchItem');

      const bookDetails = `
        <div>
          <img src="${book.thumbnail}" alt="${book.title}" />
          <strong>${book.title}</strong>
        </div>
      `;
      suggestion.innerHTML = bookDetails;

      suggestion.addEventListener('click', () => {
        document.getElementById('book-input').value = book.title;
        clearSuggestions(); // Clear suggestions after selection
      });

      suggestionsDiv.appendChild(suggestion);
    });
  }

  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Utility functions for getting content from DOM elements
  function getTextById(id) {
    const element = document.getElementById(id);
    return element ? element.textContent : '';
  }

  function getAttributeById(id, attribute) {
    const element = document.getElementById(id);
    return element ? element.getAttribute(attribute) : null;
  }

});
