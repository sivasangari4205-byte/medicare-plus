const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { generateTokens, verifyRefreshToken } = require('../services/authService');

// These are injected by server.js to avoid circular deps
let User, memStore, useMongo, getId;
const init = (deps) => { ({ User, memStore, useMongo, getId } = deps); };

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    let decoded;
    try { decoded = verifyRefreshToken(refreshToken); }
    catch { return res.status(401).json({ error: 'Invalid or expired refresh token' }); }

    if (useMongo) {
      const user = await User.findById(decoded.id);
      if (!user || user.refreshToken !== refreshToken)
        return res.status(401).json({ error: 'Refresh token revoked' });
      const payload = { id: user._id, email: user.email, role: user.role, name: user.name };
      const tokens = generateTokens(payload);
      user.refreshToken = tokens.refreshToken;
      await user.save();
      return res.json({ success: true, token: tokens.accessToken, refreshToken: tokens.refreshToken });
    } else {
      const user = memStore.users.find(u => u._id === decoded.id);
      if (!user || user.refreshToken !== refreshToken)
        return res.status(401).json({ error: 'Refresh token revoked' });
      const payload = { id: user._id, email: user.email, role: user.role, name: user.name };
      const tokens = generateTokens(payload);
      user.refreshToken = tokens.refreshToken;
      return res.json({ success: true, token: tokens.accessToken, refreshToken: tokens.refreshToken });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and revoke refresh token
 *     tags: [Auth]
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      if (useMongo) {
        await User.findOneAndUpdate({ refreshToken }, { refreshToken: '' });
      } else {
        const u = memStore.users.find(u => u.refreshToken === refreshToken);
        if (u) u.refreshToken = '';
      }
    }
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = { router, init };
