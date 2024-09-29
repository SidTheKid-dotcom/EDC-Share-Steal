const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
  // Get the token from the cookies
  const token = req.headers.token;

  // If there's no token, return an access denied error
  if (!token) {
    return res.status(403).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the user role is 'admin'
    if (decoded && decoded.role === 'ADMIN') {
      next(); // User is authenticated and has admin privileges
    } else {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
  } catch (err) {
    // If token verification fails, return an error
    return res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = adminAuth;
