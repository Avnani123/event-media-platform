const jwt = require('jsonwebtoken');

// Middleware to authenticate any logged-in user via JWT token header
exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <TOKEN>"

    if (!token) {
        return res.status(401).json({ error: "Access denied. Auth token missing." });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        req.user = verified; // Contains id, email, and role
        next();
    } catch (err) {
        res.status(403).json({ error: "Invalid or expired authentication token." });
    }
};

// Role-Based Access Control (RBAC) authorization validation hook
exports.requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Forbidden access. This action requires one of these roles: ${allowedRoles.join(', ')}` 
            });
        }
        next();
    };
};