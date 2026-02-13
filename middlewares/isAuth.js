import jwt from 'jsonwebtoken';
import APIError from '../utils/APIError.js';
import config from '../config/config.js';

const auth = async (req, res, next, optional) => {
    const authHeader = req.get('Authorization');

    if(!authHeader) {
        return next(optional ? null : new APIError(401, 'Not authenticated'));
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = await jwt.verify(token, config.jwtSecretKey);
    } catch (err) {
        return next(optional ? null : new APIError(500, 'Token verification failed', { errors: err.message }));
    }

    if(decodedToken.exp * 1000 < Date.now()) {
        return next(optional ? null : new APIError(401, 'Token has expired'));
    }

    req.user = { id: decodedToken.id, role: decodedToken.role };
    next();
}

const isAuth = async (req, res, next) => {
    auth(req, res, next, false);
}

export const isLoggedIn = async (req, res, next) => {
    auth(req, res, next, true);
}

export default isAuth;