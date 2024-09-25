require('dotenv').config();
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { password } = req.body;

  // Check if the password is provided and correct
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(400).json({
      message: "Incorrect password",
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      role: "ADMIN",
    }, // Payload
    process.env.JWT_SECRET,  // Secret key
    { expiresIn: '8h' }      // Token expiration (8 hours)
  );

  // Store token in a cookie, setting its expiration to match the JWT's expiration time
  res.cookie('token', token, {
    httpOnly: true,    // Prevent client-side JavaScript from accessing the cookie
    secure: process.env.NODE_ENV === 'production', // Send over HTTPS only in production
    //sameSite: 'strict', // Prevent CSRF
    maxAge: 8 * 60 * 60 * 1000,    // 8 hours in milliseconds
  });

  return res.json({
    message: "Admin logged in",
  });
};
