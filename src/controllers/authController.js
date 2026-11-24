const User = require('../models/User');
const tokenStore = require('../services/tokenStore');

async function signIn(req, res) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = await User.findOne({ email }).select('+password');

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.status(200).json({
    token: tokenStore.createToken(user.id),
    user: publicUser(user),
  });
}

async function signUp(req, res) {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password.trim() : '';

  if (name.length < 2 || !email.includes('@') || !phone || password.length < 8) {
    return res.status(422).json({
      message: 'Name, valid email, phone and a password of 8+ characters are required',
    });
  }

  if (await User.exists({ email })) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const userCount = await User.countDocuments();
  const user = await User.create({
    id: `u${userCount + 1}`,
    name,
    email,
    phone,
    tier: 'Standard',
    password,
  });
  return res.status(201).json({
    token: tokenStore.createToken(user.id),
    user: publicUser(user),
  });
}

function forgotPassword(req, res) {
  return res.status(200).json({
    message: 'If that email exists, a reset link has been sent',
  });
}

function me(req, res) {
  return res.status(200).json(publicUser(req.user));
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    tier: user.tier,
  };
}

module.exports = { forgotPassword, me, signIn, signUp };
