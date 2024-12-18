/*
Shuyang Song: 1155173859;
Tam Yiu Hei: 1155223226;
So Hiu Tung: 1155174920;
Marlen Runz: 1155232588
*/


const jwt = require('jsonwebtoken');

// Middleware for user authentication
const userAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Authentication required' });
    }
};

// Middleware for admin authentication
const adminAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded.isAdmin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Authentication required' });
    }
};

module.exports = {
    userAuth,
    adminAuth
}; 