# Blog Console Project

A role-based blog management application built with Node.js, JavaScript, and MySQL. Readers can browse published blogs without an account. Registered users can manage their own posts, while admins can manage users and all posts.

## Requirements

- Node.js 18 or newer
- MySQL 8 or newer, running locally or on a reachable host
- A MySQL account allowed to create a database and tables

## Setup

1. Clone the repository and enter the project directory.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and set your MySQL connection values:

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=blogdb
   ```

4. Start the application:

   ```bash
   npm start
   ```

At startup, Sequelize creates the configured database (default: `blogdb`) if needed, authenticates the connection, and synchronizes the `users` and `blogs` models. The MySQL service must already be running.

## Database

- `users`: `id`, `firstname`, nullable `lastname`, unique `email`, hashed `password`, `isActive` (defaults to `true`), `role` (defaults to `user`), `createdAt`, and `updatedAt`.
- `blogs`: `id`, `userId`, `blogTitle`, `blog`, `category`, `createdAt`, and `updatedAt`.
- `blogs.userId` references `users.id`. Deleting a user also deletes that user's blogs.
- Timestamps are managed automatically by Sequelize. `updatedAt` changes when its row is updated.
- Passwords are stored as bcrypt hashes, not as plain text.

To make an account an admin, register it first, then run this SQL using the MySQL client:

```sql
USE blogdb;
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## Features

- Public all-blog listing without logging in.
- Registration and login; deactivated users see `User is deactivated` and cannot log in.
- Users can list their blog titles, search blogs by ID or title, and create, update, or delete their own blogs.
- Admins can list all users and blogs, search any blog, change user activation status, delete users, and delete any blog.
- Sequelize models and associations manage database queries and the one-to-many relationship.

## Usage

Run `npm start`, then choose `View All Blogs`, `Login`, or `Register` from the opening menu. After login, the menu depends on the account's role. Search by entering a numeric blog ID or a title (partial titles are supported).

Run the syntax check with:

```bash
npm run check
```

## Project Demonstration

Demo video: https://drive.google.com/file/d/1d3hJI20swrl4e5_01HUpUTA6CjJazYLF/view?usp=drive_link

This video demonstrates the blog console app workflow, including public blog viewing, registration/login, user blog CRUD, admin management, and the deactivated-user login scenario.