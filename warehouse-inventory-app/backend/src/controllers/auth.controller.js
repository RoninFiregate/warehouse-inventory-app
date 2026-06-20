const jwt = require('jsonwebtoken');
const { get } = require('../db');
const { comparePassword } = require('../utils/crypto');

async function login(req, res, next) {
  try {
    const { login, haslo } = req.body;
    const user = await get('SELECT * FROM Użytkownik WHERE login = ? AND aktywny = 1', [login]);
    if (!user) return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });

    const ok = await comparePassword(haslo, user.haslo_hash);
    if (!ok) return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });

    const token = jwt.sign(
      { id: user.id, login: user.login, rola: user.rola },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, login: user.login, rola: user.rola }
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { login };
