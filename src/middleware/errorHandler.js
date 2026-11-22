function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }

  console.error('ERROR:', error);
  return res.status(500).json({ message: 'Mock server error' });
}

module.exports = errorHandler;
