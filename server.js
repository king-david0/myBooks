import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();


const app = express();
const port = 3000;

const API_URL = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.API_KEY;

// Middleware setup to parse JSON and URL-encoded data
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files like CSS, JS, and images
app.set('view engine', 'ejs'); // Set the view engine to EJS for rendering HTML templates

// PostgreSQL client setup
const db = new pg.Client({
  user:process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: 'localhost',
  database: 'books',
  port: 5432,
});

// Connect to the PostgreSQL database
db.connect();

/**
 * Route to render the homepage with a list of books from the database.
 * Fetches books ordered by the most recent addition.
 */
app.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM books ORDER BY id DESC');
    const books = result.rows;
    res.render('index.ejs', { books });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Route to render the page for adding a new book or review.
 */
app.get('/add', (req, res) => {
  res.render('new.ejs');
});

// Route to display the "add" page with a character limit error message
app.get('/addError', (req, res) => {
  res.render('new.ejs', {
    error: "Inputted text exceeds the limit of 700 characters."
  });
});

// Route to display the "add" page with an image selection error message
app.get('/addErrorNoImage', (req, res) => {
  res.render('new.ejs', {
    error: "No image selected or post content is too short."
  });
});

/**
 * Route to fetch book details for the sidebar navigation.
 * Returns a list of books with minimal details (id, title, author, date).
 */
app.get('/nav/books', async (req, res) => {
  try {
    const result = await db.query('SELECT id, title, author, date_uploaded FROM books ORDER BY date_uploaded DESC');
    const items = result.rows.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      dateUploaded: book.date_uploaded
    }));
    res.json({ items });
  } catch (err) {
    console.error('Failed to load navigation books:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Route to display a book when clicked on the sidebar.
 * Fetches and renders details for the selected book by its ID.
 */
app.get('/books/:id', async (req, res) => {
  const bookId = req.params.id;

  try {
    console.log(`Making request to database to display a book with id ${bookId}`)
    const result = await db.query('SELECT * FROM books WHERE id = $1', [bookId]);
    const books = result.rows[0];
    res.render("index.ejs", {
      books
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

/**
 * Route to search for books using the Google Books API.
 * Makes an API call to Google Books and returns a list of relevant books.
 */
app.get('/searchAPI/books', async (req, res) => {
  const query = req.query.query;

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Invalid query' });
  }

  try {
    console.log(`Searching books with query: ${query}`);
    const response = await axios.get(API_URL, {
      params: { q: query, key: API_KEY },
    });

    // Parse the response from the Google Books API
    const items = response.data.items || [];
    const books = items.map(item => {
      const volumeInfo = item.volumeInfo || {};
      const imageLinks = volumeInfo.imageLinks || {};
      const authors = volumeInfo.authors || ['Unknown Author'];

      return {
        title: volumeInfo.title || 'No title available',
        authors,
        publishedDate: volumeInfo.publishedDate || 'No date available',
        thumbnail: imageLinks.thumbnail || 'No image available',
        authorImage: authors[0] || 'No author image available',
      };
    });

    res.json({ items: books });
  } catch (error) {
    console.error('Error fetching books from API:', error);
    res.status(500).json({ items: [] });
  }
});

/**
 * Route to submit a review for a book.
 * Takes data from the request and inserts a new book review into the database.
 */
app.post('/submit-review', async (req, res) => {
  const { postContent, selectedTitle, authorImage, selectedAuthor, selectedThumbnail, selectedDate } = req.body;

  // Function to normalize the date format
  function normalizeDate(date) {
    if (!date) return null;
    if (/^\d{4}$/.test(date)) return `${date}-01-01`;
    if (/^\d{4}-\d{2}$/.test(date)) return `${date}-01`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    return null;
  }

  const normalizedDate = normalizeDate(selectedDate);
  const currentDate = new Date(); // Store the current date for date_uploaded

  const newPost = {
    content: postContent || 'No content provided',
    title: selectedTitle || 'Unknown Title',
    authorImage: authorImage || 'No Author image',
    author: selectedAuthor || 'Unknown Author',
    thumbnail: selectedThumbnail || '/images/default-thumbnail.png',
    publishedDate: normalizedDate,
    date: currentDate
  };

  try {
    console.log(newPost)
    // Insert the review into the database
     db.query(
      'INSERT INTO books (title, author, thumbnail, published_date, date_uploaded, review, author_image) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [newPost.title, newPost.author, newPost.thumbnail, newPost.publishedDate, newPost.date, newPost.content, newPost.authorImage]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error inserting review:', err);
    res.json({ success: false });
  }
});

/**
 * Route to search for books from the database based on a query.
 * Searches for books where the title matches the input query (case insensitive).
 */
app.get('/database/books', async (req, res) => {
  const query = req.query.query;

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Invalid query' });
  }

  try {
    console.log(`Searching books in database with query: ${query}`);
    const result = await db.query(
      `SELECT * FROM books WHERE LOWER(title) LIKE '%' || $1 || '%'`,
      [query.toLowerCase()]
    );

    const items = result.rows.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      publishedDate: book.published_date,
      thumbnail: book.thumbnail
    }));

    res.json({ items });
  } catch (err) {
    console.error('Database query failed:', err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

/**
 * Route to update a book's review by its ID.
 * Sends an update request to modify the review in the database.
 */
app.patch('/books/update/:id', async (req, res) => {
  const bookId = req.params.id;
  const { review } = req.body;
  console.log(`Updating review of book with id ${bookId} to ${review}`);
  try {
    await db.query('UPDATE books SET review = $1 WHERE id = $2', [review, bookId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * Route to delete a book by its ID.
 * Removes the book from the database.
 */
app.delete('/books/delete/:id', async (req, res) => {
  const bookId = req.params.id;

  try {
    console.log(`Deleting book with id ${bookId}`)
    const result = await db.query('DELETE FROM books WHERE id = $1', [bookId]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Book not found' });
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start the server and listen on port 3000
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
