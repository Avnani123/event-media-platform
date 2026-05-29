const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Target the root uploads folder safely
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Engine Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let ext = '';
    
    if (file && file.originalname) {
      ext = path.extname(file.originalname).toLowerCase();
    }
    
    // Fallback logic if filename lacks an extension
    if (!ext || ext === '') {
      if (file.mimetype === 'image/png') ext = '.png';
      else if (file.mimetype === 'image/webp') ext = '.webp';
      else if (file.mimetype === 'image/gif') ext = '.gif';
      else ext = '.jpg';
    }
    
    cb(null, `${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage });

// Database Mock Catalog In-Memory Store
let globalDatabaseCatalog = [
  {
    id: 1001,
    title: "Opening Keynote Address",
    category: "Workshop",
    s3_optimized_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    ai_tags: ["presentation", "tech", "main stage"],
    likes_count: 24,
    event: { name: "Nexus National Hackathon 2026", club_name: "Coding Club Core" }
  },
  {
    id: 1002,
    title: "Project Prototyping Rush",
    category: "Competition",
    s3_optimized_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
    ai_tags: ["tech", "crowd"],
    likes_count: 8,
    event: { name: "Nexus National Hackathon 2026", club_name: "Coding Club Core" }
  }
];

// 1. SEARCH ENDPOINT (Handles both blank loads and custom string query searches)
router.get('/search', (req, res) => {
  try {
    const searchWord = (req.query.query || "").toLowerCase().trim();

    if (!searchWord) {
      return res.status(200).json(globalDatabaseCatalog);
    }

    const matches = globalDatabaseCatalog.filter(item => {
      return item.title?.toLowerCase().includes(searchWord) ||
             item.category?.toLowerCase().includes(searchWord) ||
             item.ai_tags?.some(tag => tag.toLowerCase().includes(searchWord));
    });

    return res.status(200).json(matches);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. BULK UPLOAD INGESTION ROUTE
router.post('/bulk-upload', upload.array('photos', 50), async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ success: false, error: "No files received." });
    }

    const newlyIndexedAssets = [];

    files.forEach((file) => {
      const webFriendlyFilename = file.filename.replace(/\\/g, '/');
      
      const generatedAsset = {
        id: Number(Date.now() + Math.floor(Math.random() * 100000)),
        title: file.originalname ? file.originalname.split('.')[0] : "Ingested Batch Image",
        category: "User Upload",
        s3_optimized_url: `http://localhost:5000/uploads/${webFriendlyFilename}`,
        ai_tags: ["uploaded", "local-cache", "processed"],
        likes_count: 0,
        event: { name: "Live Catalog Sync", club_name: "Active Sandbox Admin" }
      };

      newlyIndexedAssets.push(generatedAsset);
    });

    globalDatabaseCatalog = [...newlyIndexedAssets, ...globalDatabaseCatalog];

    return res.status(200).json({ 
      success: true, 
      count: files.length, 
      catalog: globalDatabaseCatalog 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 3. STUB INTERACTIONS (Prevents 404 errors when clicking buttons)
router.post('/:id/like', (req, res) => {
  res.status(200).json({ success: true, message: "Interaction registered!" });
});

router.get('/:id/download', (req, res) => {
  res.status(200).json({ success: true, watermarkText: "SECURED CONTENT", originalAsset: "Local Node Buffer Stack" });
});

router.get('/ai/discovery', (req, res) => {
  res.status(200).json(globalDatabaseCatalog);
});

module.exports = router;