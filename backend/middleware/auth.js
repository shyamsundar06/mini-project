const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tourism_intelligent_platform_jwt_secret_key_2026';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ success: false, message: `Access denied. Requires ${role} role.` });
        }
        next();
    };
}

module.exports = {
    JWT_SECRET,
    authenticateToken,
    requireRole
};
