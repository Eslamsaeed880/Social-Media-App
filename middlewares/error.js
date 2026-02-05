import APIError from "../utils/APIError.js";
import config from "../config/config.js";

export const errorHandler = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof APIError)) {
        const statusCode = error.statusCode || error.status || 500;
        const message = error.message || 'Internal Server Error';
        error = new APIError(statusCode, message, error?.errors || [], err.stack);
    }

    const response = {
        success: false,
        message: error?.message,
        errors: error?.errors,
        stack: config.env === 'development' ? error?.stack : undefined,
    }

    return res.status(error.statusCode).json(response);
}

export const notFound = (req, res, next) => {
    const error = new APIError(404, `Not Found - ${req.originalUrl}`);
    next(error);
}