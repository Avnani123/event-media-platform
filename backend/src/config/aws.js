const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const path = require('path');

// Initialize the S3 client instance
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// Configure local memory storage allocation buffer before compression running
const storage = multer.memoryStorage();

// Intercept files to confirm they conform strictly to image/video specifications
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Invalid file structure format. Only specified images and videos are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB Max upload threshold allowance
});

module.exports = { s3, upload };