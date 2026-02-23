import isAuth from "./isAuth.js";
import APIError from "../utils/APIError.js";

const isAdmin = [
    isAuth,
    (req, res, next) => {
        try {
            if (req.user.role !== 'admin') {
                console.log(req.user);
                return next(new APIError(403, 'Access denied'));
            }

            return next();
        } catch (error) {
            console.log(error);
            return next(new APIError(500, 'Server error'));
        }
    }
];

export default isAdmin;