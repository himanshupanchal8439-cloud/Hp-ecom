const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token', message: err.message });
    }
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  // First verify token
  verifyToken(req, res, () => {
    // Check if user is admin (this is a placeholder - implement admin role check in DB)
    // For now, we'll just pass through. In production, verify admin role from database
    next();
  });
};

module.exports = { verifyToken, verifyAdmin };
