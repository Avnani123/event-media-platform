const express = require('express');
const router = express.Router();
const multer = require('multer');
const AWS = require('aws-sdk');
require('dotenv').config();

// 1. Initialize AWS S3 Interface Configuration Engine
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// 2. Configure Multer Memory Storage Pipeline (Avoids writing temp files to local server disk)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Cap single images at 10MB
});

/**
 * @route   POST /media/bulk-upload
 * @desc    Handles multipart array ingestion, pumps binaries to AWS S3, returns storage paths.
 */
router.post('/bulk-upload', upload.array('photos', 50), async (req, res) => {
  try {
    const files = req.files;
    
    // Safety check: Validate bundle existence
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Transmission error: No asset items detected in payload bundle." });
    }

    console.log(`🚀 Bulk pipeline activated: Processing ${files.length} uploads...`);

    // 3. Map array into an individual S3 streaming upload promise sequence
    const uploadPromises = files.map(file => {
      const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${file.originalname}`;
      
      const s3Params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `events/${uniqueFilename}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read' // Gives read access so your frontend grid matrix can load the image immediately
      };

      return s3.upload(s3Params).promise();
    });

    // 4. Fire all upload processes concurrently
    const s3UploadResults = await Promise.all(uploadPromises);

    // Extract optimization URLs returned from successful AWS streams
    const uploadedUrls = s3UploadResults.map(result => result.Location);
    console.log(`✅ Multi-stream upload sequence clear! successfully pushed paths to cloud storage.`);

    /* 💡 OPTIONAL DB STEP:
       This is where you can write a DB query to store these URLs in your media table:
       await db.query("INSERT INTO media (s3_optimized_url, ai_tags) VALUES ...", [uploadedUrls]);
    */

    // 5. Respond to frontend to clear loading spinners automatically
    return res.status(200).json({
      message: "Bulk file streaming pipeline completed successfully.",
      count: files.length,
      urls: uploadedUrls
    });

  } catch (error) {
    console.error("❌ Critical Backend parsing error:", error);
    return res.status(500).json({ 
      error: "Internal cluster error processing batch pipeline.", 
      details: error.message 
    });
  }
});

module.exports = router;