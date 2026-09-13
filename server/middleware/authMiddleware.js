const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization header missing or invalid format! Expected Bearer <token>' });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        req.userData = {
            ...decodedToken,
            userId: decodedToken.userId || decodedToken.id,
            id: decodedToken.userId || decodedToken.id
        };
        req.userId = req.userData.userId;

        next();
    } catch (err) {
        return res.status(401).json({ message: 'Authentication failed! Invalid or expired token.' });
    }
};