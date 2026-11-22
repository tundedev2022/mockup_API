const User = require('../models/User');

function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.replace('Bearer ', '');
  const userId = User.findUserIdByToken(token);
  const user = userId ? User.findById(userId) : null;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized. Sign in first.' });
  }

  req.user = user;
  next();
}

module.exports = requireAuth;
