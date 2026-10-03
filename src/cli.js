import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import * as services from './services.js';

const rl = readline.createInterface({ input: stdin, output: stdout });

async function ask(label) {
  try {
    return (await rl.question(label)).trim();
  } catch (error) {
    if (error.code === 'ERR_USE_AFTER_CLOSE') {
      const inputClosed = new Error('Console input closed.');
      inputClosed.code = 'INPUT_CLOSED';
      throw inputClosed;
    }
    throw error;
  }
}

async function askRequired(label) {
  while (true) {
    const value = await ask(label);
    if (value) return value;
    console.log('This field is required.');
  }
}

function showBlogs(blogs) {
  if (blogs.length === 0) {
    console.log('No blogs are found');
    return;
  }

  for (const blog of blogs) {
    console.log(`\nBlog ID: ${blog.id}`);
    console.log(`Title: ${blog.blogTitle}`);
    console.log(`Category: ${blog.category}`);
    if (blog.firstname) console.log(`Author: ${blog.firstname} ${blog.lastname}`);
    console.log(`Created: ${blog.createdAt}`);
    console.log(`Updated: ${blog.updatedAt}`);
    console.log(`\n${blog.blog}\n`);
    console.log('-'.repeat(60));
  }
}

function showBlogTitles(blogs) {
  if (blogs.length === 0) {
    console.log('No blogs are found');
    return;
  }
  console.log('\nYour blogs:');
  for (const blog of blogs) {
    console.log(`${blog.id}. ${blog.blogTitle}`);
  }
}

async function viewAllBlogs() {
  showBlogs(await services.allBlog());
}

async function searchBlog() {
  const query = await askRequired('Enter blog ID or title: ');
  showBlogs(await services.searchBlogs(query));
}

async function register() {
  console.log('\nRegister');
  const firstname = await askRequired('First name: ');
  const lastname = await askRequired('Last name: ');
  const email = await askRequired('Email: ');
  const password = await askRequired('Password: ');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log('Enter a valid email address.');
    return;
  }
  try {
    const userId = await services.registerUser({ firstname, lastname, email, password });
    console.log(`Registration successful. Your user ID is ${userId}.`);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('That email address is already registered.');
      return;
    }
    throw error;
  }
}

async function login() {
  console.log('\nLogin');
  const email = await askRequired('Email: ');
  const password = await askRequired('Password: ');
  const result = await services.loginUser(email, password);
  if (result.error) {
    console.log(result.error);
    return;
  }

  console.log(`\nWelcome, ${result.user.firstname}!`);
  if (result.user.role === 'admin') {
    await adminMenu(result.user);
  } else {
    await userMenu(result.user);
  }
}

async function userMenu(user) {
  showBlogTitles(await services.getUserBlogs(user.id));

  while (true) {
    console.log('\nUser Console Menu');
    console.log('1. View Your Blogs');
    console.log('2. Search Blog by ID/Title');
    console.log('3. Create Blog');
    console.log('4. Update Blog');
    console.log('5. Delete Blog');
    console.log('0. Log out');
    const choice = await ask('Select an option: ');

    if (choice === '1') {
      showBlogTitles(await services.getUserBlogs(user.id));
    } else if (choice === '2') {
      await searchBlog();
    } else if (choice === '3') {
      const blogTitle = await askRequired('Blog title: ');
      const category = await askRequired('Category: ');
      const blog = await askRequired('Blog content: ');
      const id = await services.createBlog(user.id, { blogTitle, category, blog });
      console.log(`Blog created with ID ${id}.`);
    } else if (choice === '4') {
      const blogId = await askRequired('Blog ID to update: ');
      if (!/^\d+$/.test(blogId)) {
        console.log('Enter a valid blog ID.');
        continue;
      }
      const blogTitle = await askRequired('New title: ');
      const category = await askRequired('New category: ');
      const blog = await askRequired('New blog content: ');
      const updated = await services.updateBlog(user.id, Number(blogId), { blogTitle, category, blog });
      console.log(updated ? 'Blog updated.' : 'Blog not found in your account.');
    } else if (choice === '5') {
      const blogId = await askRequired('Blog ID to delete: ');
      if (!/^\d+$/.test(blogId)) {
        console.log('Enter a valid blog ID.');
        continue;
      }
      const deleted = await services.deleteBlog(Number(blogId), user.id);
      console.log(deleted ? 'Blog deleted.' : 'Blog not found in your account.');
    } else if (choice === '0') {
      return;
    } else {
      console.log('Choose a listed option.');
    }
  }
}

function showUsers(users) {
  if (users.length === 0) {
    console.log('No users are found');
    return;
  }
  for (const user of users) {
    console.log(`${user.id}. ${user.firstname} ${user.lastname} | ${user.email} | ${user.role} | ${user.isActive ? 'Active' : 'Deactivated'}`);
  }
}

async function adminMenu(admin) {
  while (true) {
    console.log('\nAdmin Console Menu');
    console.log('1. View All Users');
    console.log('2. View All Blogs');
    console.log('3. Search Blog by ID/Title');
    console.log('4. Update User');
    console.log('5. Delete User');
    console.log('6. Delete Blog');
    console.log('0. Log out');
    const choice = await ask('Select an option: ');

    if (choice === '1') {
      showUsers(await services.allUsers());
    } else if (choice === '2') {
      showBlogs(await services.allUsersBlog());
    } else if (choice === '3') {
      await searchBlog();
    } else if (choice === '4') {
      const userId = await askRequired('User ID to update: ');
      if (!/^\d+$/.test(userId)) {
        console.log('Enter a valid user ID.');
        continue;
      }
      const status = await ask('Set status (1 = active, 0 = deactivated): ');
      if (status !== '1' && status !== '0') {
        console.log('Choose 1 or 0.');
        continue;
      }
      const updated = await services.updateUserStatus(Number(userId), status === '1');
      console.log(updated ? 'User status updated.' : 'User not found.');
      if (updated && Number(userId) === admin.id && status === '0') return;
    } else if (choice === '5') {
      const userId = await askRequired('User ID to delete: ');
      if (!/^\d+$/.test(userId)) {
        console.log('Enter a valid user ID.');
        continue;
      }
      const deleted = await services.deleteUser(Number(userId));
      console.log(deleted ? 'User and their blogs deleted.' : 'User not found.');
      if (deleted && Number(userId) === admin.id) return;
    } else if (choice === '6') {
      const blogId = await askRequired('Blog ID to delete: ');
      if (!/^\d+$/.test(blogId)) {
        console.log('Enter a valid blog ID.');
        continue;
      }
      const deleted = await services.deleteBlog(Number(blogId));
      console.log(deleted ? 'Blog deleted.' : 'Blog not found.');
    } else if (choice === '0') {
      return;
    } else {
      console.log('Choose a listed option.');
    }
  }
}

async function runCli() {
  try {
    while (true) {
      console.log('\nBlog Console');
      console.log('1. View All Blogs');
      console.log('2. Login');
      console.log('3. Register');
      console.log('0. Exit');
      const choice = await ask('Select an option: ');

      if (choice === '1') {
        await viewAllBlogs();
      } else if (choice === '2') {
        await login();
      } else if (choice === '3') {
        await register();
      } else if (choice === '0') {
        break;
      } else {
        console.log('Choose a listed option.');
      }
    }
  } catch (error) {
    if (error.code !== 'INPUT_CLOSED') throw error;
  } finally {
    rl.close();
  }
}

export { runCli };
