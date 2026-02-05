
const config = {
    mongodbUri: process.env.MONGODB_URI,
     
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY,

    port: process.env.PORT || 3000,

    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    mail: {
        password: process.env.NODEMAILER_PASSWORD,
        sender: process.env.MAIL_SENDER
    },

    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS),

    corsOrigin: process.env.CORS_ORIGIN,
}

export default config;