import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { Blog, User } from './models/index.js';

async function registerUser({ firstname, lastname, email, password }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    firstname,
    lastname: lastname || null,
    email: email.trim().toLowerCase(),
    password: passwordHash,
  });
  return user.id;
}

async function loginUser(email, password) {
  const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
  if (!user) return { error: 'Invalid email or password.' };
  if (!user.isActive) return { error: 'User is deactivated' };
  if (!(await bcrypt.compare(password, user.password))) {
    return { error: 'Invalid email or password.' };
  }

  const safeUser = user.get({ plain: true });
  delete safeUser.password;
  return { user: safeUser };
}

function flattenBlog(blog) {
  const result = blog.get({ plain: true });
  result.userId = result.author?.id;
  result.firstname = result.author?.firstname;
  result.lastname = result.author?.lastname;
  delete result.author;
  return result;
}

async function allBlog() {
  const blogs = await Blog.findAll({
    include: [{ model: User, as: 'author', attributes: ['id', 'firstname', 'lastname'] }],
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
  });
  return blogs.map(flattenBlog);
}

async function allUsers() {
  const users = await User.findAll({
    attributes: { exclude: ['password'] },
    order: [['id', 'ASC']],
  });
  return users.map((user) => user.get({ plain: true }));
}

async function allUsersBlog() {
  return allBlog();
}

async function getUserBlogs(userId) {
  const blogs = await Blog.findAll({
    attributes: ['id', 'blogTitle', 'category', 'createdAt', 'updatedAt'],
    where: { userId },
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
  });
  return blogs.map((blog) => blog.get({ plain: true }));
}

async function searchBlogs(query) {
  const trimmedQuery = query.trim();
  const where = /^\d+$/.test(trimmedQuery)
    ? { id: Number(trimmedQuery) }
    : { blogTitle: { [Op.like]: `%${trimmedQuery}%` } };
  const blogs = await Blog.findAll({
    where,
    include: [{ model: User, as: 'author', attributes: ['id', 'firstname', 'lastname'] }],
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
  });
  return blogs.map(flattenBlog);
}

async function createBlog(userId, { blogTitle, blog, category }) {
  const createdBlog = await Blog.create({ userId, blogTitle, blog, category });
  return createdBlog.id;
}

async function updateBlog(userId, blogId, { blogTitle, blog, category }) {
  const [updatedCount] = await Blog.update(
    { blogTitle, blog, category },
    { where: { id: blogId, userId } },
  );
  return updatedCount > 0 || Boolean(await Blog.findOne({ where: { id: blogId, userId } }));
}

async function deleteBlog(blogId, userId) {
  const where = userId === undefined ? { id: blogId } : { id: blogId, userId };
  return (await Blog.destroy({ where })) > 0;
}

async function updateUserStatus(userId, isActive) {
  const [updatedCount] = await User.update({ isActive }, { where: { id: userId } });
  return updatedCount > 0 || Boolean(await User.findByPk(userId));
}

async function deleteUser(userId) {
  return (await User.destroy({ where: { id: userId } })) > 0;
}

export {
  allBlog,
  allUsers,
  allUsersBlog,
  createBlog,
  deleteBlog,
  deleteUser,
  getUserBlogs,
  loginUser,
  registerUser,
  searchBlogs,
  updateBlog,
  updateUserStatus,
};
