const User = require('../models/User');

function signIn(req, res) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = User.findByEmail(email);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.status(200).json({
    token: User.createToken(user.id),
    user: User.publicUser(user),
  });
}

function signUp(req, res) {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (name.length < 2 || !email.includes('@') || !phone || password.length < 8) {
    return res.status(422).json({
      message: 'Name, valid email, phone and a password of 8+ characters are required',
    });
  }

  if (User.findByEmail(email)) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const user = User.create({ name, email, phone, password });
  return res.status(201).json({
    token: User.createToken(user.id),
    user: User.publicUser(user),
  });
}

function forgotPassword(req, res) {
  return res.status(200).json({
    message: 'If that email exists, a reset link has been sent',
  });
}

function me(req, res) {
  return res.status(200).json(User.publicUser(req.user));
}

module.exports = { forgotPassword, me, signIn, signUp };
