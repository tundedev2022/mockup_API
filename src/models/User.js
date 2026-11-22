const users = [
  {
    id: 'u1',
    name: 'Adaeze Okafor',
    email: 'demo@haulr.com',
    phone: '08012345678',
    tier: 'Gold',
    password: 'password123',
  },
];
const tokens = new Map();

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    tier: user.tier,
  };
}

function findByEmail(email) {
  return users.find((user) => user.email === email) || null;
}

function findById(id) {
  return users.find((user) => user.id === id) || null;
}

function create({ name, email, phone, password }) {
  const user = {
    id: `u${users.length + 1}`,
    name,
    email,
    phone,
    tier: 'Standard',
    password,
  };
  users.push(user);
  return user;
}

function createToken(userId) {
  const token = `mock-token-${userId}-${Date.now()}`;
  tokens.set(token, userId);
  return token;
}

function findUserIdByToken(token) {
  return tokens.get(token) || null;
}

module.exports = {
  create,
  createToken,
  findByEmail,
  findById,
  findUserIdByToken,
  publicUser,
};
