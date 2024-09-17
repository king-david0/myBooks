
# Book Review Application
# i called it myBooks...
A capstone project under Angela Yu's Web development course.

This is a Node.js application that allows users to add, search, and review books. The app uses PostgreSQL for the database, Axios for making API requests, and Google Books API for external book data.

## Features
- Add and review books.
- Search for books from Google Books API.
- Update and delete reviews.
- Responsive layout for mobile and desktop views.

## Getting Started

Follow these instructions to set up and run the app locally.

### Prerequisites

Before you begin, make sure you have the following installed:

- [Node.js](https://nodejs.org/en/download/) (v14+)
- [PostgreSQL](https://www.postgresql.org/download/) (v12+)
- [Nodemon](https://www.npmjs.com/package/nodemon) (optional for development)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo
   ```

2. **Install dependencies**:
   Make sure you are in the project directory and install the required Node.js dependencies:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root of your project and add your Google Books API key:
   ```bash
   API_KEY=your_google_books_api_key
   DB_PASSWORD=your_pgAdmin_password
   ```

4. **Initialize the PostgreSQL Database**:
   - Open PostgreSQL and create a database named `books`:
     ```sql
     CREATE DATABASE books;
     ```

   - Connect to the `books` database:
     ```bash
     psql -U postgres -d books
     ```

   - Run the following SQL query to create the `books` table:
     ```sql
     CREATE TABLE books (
       id SERIAL PRIMARY KEY,
       title text,
       author VARCHAR(150),
       thumbnail VARCHAR(500),
       published_date DATE,
       date_uploaded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       review VARCHAR(700),
       author_image VARCHAR(500)
     );
     ```

5. **Run the Application**:
   Start the server by running:
   ```bash
   npm start
   ```

   You can also use `nodemon` to automatically restart the server on file changes:
   ```bash
   nodemon
   ```

6. **Access the App**:
   - Open your browser and navigate to `http://localhost:3000` to access the app.

### Navigating the Application

- **Home**: View all the books and reviews.
- **Add Review**: Click the "Add" button to add a new book review.
- **Search**: Use the search functionality to find books from Google Books API.
- **Sidebar**: Navigate through your local books using the sidebar.

### API Endpoints

- `GET /`: Fetches all books and renders the homepage.
- `GET /add`: Renders the form to add a new book.
- `POST /submit-review`: Submits a new book review to the database.
- `PATCH /books/update/:id`: Updates an existing review.
- `DELETE /books/delete/:id`: Deletes a book from the database.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
