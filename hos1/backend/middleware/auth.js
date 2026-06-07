const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
    next();
  });
};

const doctorAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Doctor access required.' });
    next();
  });
};

const pharmacistAuth = (req, res, next) => {
  auth(req, res, () => {
    if (!['pharmacist', 'admin'].includes(req.user.role))
      return res.status(403).json({ error: 'Pharmacist access required.' });
    next();
  });
};

module.exports = { auth, adminAuth, doctorAuth, pharmacistAuth };
