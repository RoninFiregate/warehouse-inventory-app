const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  console.log('AUTH HEADER:', header);
  console.log('TOKEN PRESENT:', Boolean(token));
  console.log('JWT_SECRET IN AUTH:', process.env.JWT_SECRET);

  if (!token) return res.status(401).json({ error: 'Brak tokenu' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('TOKEN OK:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('TOKEN VERIFY ERROR:', err.message);
    return res.status(401).json({ error: 'Nieprawidłowy token' });
  }
}

module.exports = auth;
