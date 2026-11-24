const User = require('../models/User');
const tokenStore = require('../services/tokenStore');

async function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.replace('Bearer ', '');
  const userId = tokenStore.findUserId(token);
  const user = userId ? await User.findOne({ id: userId }) : null;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized. Sign in first.' });
  }

  req.user = user;
  next();
}

module.exports = requireAuth;
