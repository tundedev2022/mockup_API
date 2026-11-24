const tokens = new Map();

function createToken(userId) {
  const token = `mock-token-${userId}-${Date.now()}`;
  tokens.set(token, userId);
  return token;
}

function findUserId(token) {
  return tokens.get(token) || null;
}

module.exports = { createToken, findUserId };
