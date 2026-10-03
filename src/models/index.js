import Blog from './Blog.js';
import User from './User.js';

User.hasMany(Blog, {
  as: 'blogs',
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Blog.belongsTo(User, {
  as: 'author',
  foreignKey: 'userId',
});

export { Blog, User };