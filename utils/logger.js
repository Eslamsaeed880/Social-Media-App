import winston from 'winston';

const { combine, timestamp, errors, splat, colorize, printf, json } = winston.format;

const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const sanitizeMeta = (meta) => {
    if (meta instanceof Error) {
        return {
            name: meta.name,
            message: meta.message,
            stack: meta.stack,
        };
    }

    if (typeof meta === 'object' && meta !== null) {
        return meta;
    }

    return { value: meta };
};

const consoleFormat = combine(
    colorize({ all: true }),
    timestamp(),
    errors({ stack: true }),
    splat(),
    printf(({ timestamp: ts, level, message, stack, ...meta }) => {
        const metaKeys = Object.keys(meta || {});
        const metaText = metaKeys.length ? ` ${JSON.stringify(meta)}` : '';

        if (stack) {
            return `${ts} ${level}: ${message}${metaText}\n${stack}`;
        }

        return `${ts} ${level}: ${message}${metaText}`;
    })
);

const productionFormat = combine(
    timestamp(),
    errors({ stack: true }),
    splat(),
    json()
);

const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: IS_PRODUCTION ? productionFormat : consoleFormat,
    transports: [new winston.transports.Console()],
    defaultMeta: { service: 'social-media-app' },
});

export const createModuleLogger = (moduleName) => logger.child({ module: moduleName });

let isConsoleOverridden = false;

const mapLevel = {
    log: 'info',
    info: 'info',
    warn: 'warn',
    error: 'error',
    debug: 'debug',
};

export const overrideConsoleMethods = () => {
    if (isConsoleOverridden) {
        return;
    }

    ['log', 'info', 'warn', 'error', 'debug'].forEach((method) => {
        const level = mapLevel[method];

        console[method] = (...args) => {
            const [first, ...rest] = args;

            if (typeof first === 'string') {
                if (rest.length === 0) {
                    logger[level](first);
                    return;
                }

                if (rest.length === 1) {
                    logger[level](first, sanitizeMeta(rest[0]));
                    return;
                }

                logger[level](first, { args: rest.map(sanitizeMeta) });
                return;
            }

            logger[level]('log', { args: args.map(sanitizeMeta) });
        };
    });

    isConsoleOverridden = true;
};

export default logger;