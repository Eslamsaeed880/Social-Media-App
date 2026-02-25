/**
 * Reusable validation middleware wrapper
 * Validates request data (body/params/query) against a Joi schema
 */
export const validateRequest = (schema, source = 'body') => {
    return (req, res, next) => {
        const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
        const { error, value } = schema.validate(data, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
        });

        if (error) {
            const messages = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            return res.status(400).json({
                statusCode: 400,
                message: 'Validation failed',
                errors: messages,
            });
        }

        // Only reassign body (params and query are read-only in Express)
        if (source === 'body') {
            req.body = value || {};
        }

        next();
    };
};

export default validateRequest;
