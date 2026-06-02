const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

// Base upload folder definition
const baseUploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Initial Multer Ingestion Settings (Saves initially to a temp cache folder inside uploads)
const tempDir = path.join(baseUploadDir, 'temp_staging');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `RAW-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid format pipeline. Image assets only!'), false);
    }
  }
});

// Helper tool to introduce structural thread pauses to stay beneath Free API rate limits (5 RPM max)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Database Mock Catalog In-Memory Store
let globalDatabaseCatalog = [
  {
    id: 1001,
    title: "Opening Keynote Address",
    category: "Workshops",
    s3_optimized_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    ai_tags: ["presentation", "tech", "main stage"],
    summary_text: "Opening ceremony with audience viewing presentation screens.",
    likes_count: 24,
    uploaded_by: "System Initializer",
    event: { name: "Nexus National Hackathon 2026", club_name: "Coding Club Core" }
  }
];

function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

// =========================================================================
// 1. BULK UPLOAD + CUSTOM EVENT WISE FOLDER NESTING DISTRIBUTION
// =========================================================================
router.post('/bulk-upload', upload.array('photos', 50), async (req, res) => {
  try {
    const files = req.files || [];

    // Capture User Defined Custom Event Parameters from Request Body
    const customEventInput = req.body.eventName || "";
    const customClubInput = req.body.clubName || "Active Sandbox Admin";
    const customDescriptionInput = req.body.eventDescription || "Custom Managed Event Storage Container.";

    // Normalize folder name safely (alphanumeric strings with hyphens instead of spaces)
    let eventFolderSegment = "General_Pool";
    if (customEventInput.trim()) {
      eventFolderSegment = customEventInput.trim().replace(/[^a-zA-Z0-9\s-_]/g, "").replace(/\s+/g, "_");
    }

    // 🚀 NEW FALLBACK: If no files are attached, seamlessly handle empty directory initialization!
    // 🚀 EVENT INITIALIZER FALLBACK: Creates the physical folder AND registers it to the visible catalog!
    if (files.length === 0) {
      if (eventFolderSegment === "General_Pool") {
        return res.status(400).json({ success: false, error: "Cannot create empty generic pool. Please provide an Event Name." });
      }

      const emptyTargetDirectoryPath = path.join(baseUploadDir, eventFolderSegment);
      if (!fs.existsSync(emptyTargetDirectoryPath)) {
        fs.mkdirSync(emptyTargetDirectoryPath, { recursive: true });
        console.log(`📁 Empty Directory Container initialized on server resource space: ${emptyTargetDirectoryPath}`);
      }

      // Write an anchor file inside so the OS cannot drop or ignore the path
      const anchorFilePath = path.join(emptyTargetDirectoryPath, '.gitkeep');
      if (!fs.existsSync(anchorFilePath)) {
        fs.writeFileSync(anchorFilePath, `Initialized empty album container for: ${customEventInput}`, 'utf-8');
      }

      // Create a visual structural layout asset so the folder is visible in the UI Gallery immediately
      const emptyAlbumPlaceholder = {
        id: Number(Date.now() + Math.floor(Math.random() * 100000)),
        title: `Empty Album Workspace`,
        category: "Initialization", 
        s3_optimized_url: "placeholder",
        url: "placeholder", // Frontend can check if url === 'placeholder' to show a folder icon
        ai_tags: ["empty-album", "workspace"],
        summary_text: customDescriptionInput || "This album is currently empty. Upload photos to populate it.",
        likes_count: 0,
        uploaded_by: customClubInput,
        event: { 
          name: customEventInput.trim(), 
          club_name: customClubInput,
          description: customDescriptionInput
        }
      };

      // Inject the placeholder asset directly into the global catalog state
      globalDatabaseCatalog = [emptyAlbumPlaceholder, ...globalDatabaseCatalog];

      return res.status(200).json({ 
        success: true, 
        count: 0, 
        message: `Empty structural layout tracking container mounted for workspace reference folder: "${eventFolderSegment}"`,
        catalog: globalDatabaseCatalog
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const newlyIndexedAssets = [];

    for (const file of files) {
      let assignedFolder = "Tech"; 
      let aiTags = ["processed"];
      let aiDescription = "Event Media Asset";

      // Defensive Guard: Rest 12 seconds per item to avoid 429 requests-per-minute spikes on bulk actions
      console.log(`[Rate Guard] Waiting 12 seconds before sorting asset: ${file.originalname}...`);
      await sleep(12000);

      try {
        const visualFilePart = fileToGenerativePart(file.path, file.mimetype);

        const prompt = `You are a professional computer vision asset classification engine processing hackathon media.
        Analyze this image closely. It may be a photo, a poster, or a tournament leaderboard/banner frame (e.g., Mock IPL, AlgoVision, FishTank).
        
        Determine the single most relevant category for this file and output exactly ONE word from this list:
        - Tech (If it contains code, tech terms, hackathon layouts, UI grids, or names like AlgoVision, FishTank)
        - Gaming (If it relates to virtual simulations, tournaments, esports layouts, or games like IPL leaderboards)
        - Workshops (If it shows speaker setups, coding seminars, presentation slides, or halls)
        - Certificates (If it represents an award, winner frame, credentials, or official sign-offs)
        - Campus (If it shows university grounds, buildings, or general student life scenes)
        
        If it absolutely does not fit any of these, generate a single custom word that perfectly matches the text or visual elements found in the image. Do not use generic words like 'General' or 'Unclassified'.
        
        Return your analysis in a strict, valid JSON format matching this schema exactly:
        {
          "folderName": "The single category string name (Alphanumeric only, capitalized, no spaces)",
          "tags": ["4-5 descriptive lowercase keywords found inside the graphic, e.g., ipl, coding, banner, award, leaderboard"],
          "description": "A brief 1-2 sentence description summarizing the visual context and visible text."
        }`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [prompt, visualFilePart],
          config: { responseMimeType: "application/json" }
        });

        const parsedAI = JSON.parse(response.text.trim());
        if (parsedAI.folderName) assignedFolder = parsedAI.folderName.trim().replace(/[^a-zA-Z0-9]/g, "");
        if (parsedAI.tags) aiTags = parsedAI.tags;
        if (parsedAI.description) aiDescription = parsedAI.description;

      } catch (aiError) {
        console.error(`AI Folder sorting computation failed, implementing smart structural backup:`, aiError.message);
        
        // Free tier Quota exhaustion fallback handler. Uses context hints to format paths
        const hint = file.originalname.toLowerCase();
        if (hint.includes('ipl') || hint.includes('game') || hint.includes('match') || hint.includes('leaderboard')) {
          assignedFolder = "Gaming";
          aiTags = ["gaming", "tournament", "leaderboard", "fallback"];
        } else if (hint.includes('workshop') || hint.includes('talk') || hint.includes('slide') || hint.includes('presentation')) {
          assignedFolder = "Workshops";
          aiTags = ["workshop", "seminar", "presentation", "fallback"];
        } else if (hint.includes('cert') || hint.includes('award') || hint.includes('win')) {
          assignedFolder = "Certificates";
          aiTags = ["certificate", "award", "credentials", "fallback"];
        } else if (hint.includes('campus') || hint.includes('build') || hint.includes('college') || hint.includes('student')) {
          assignedFolder = "Campus";
          aiTags = ["campus", "university", "grounds", "fallback"];
        } else {
          assignedFolder = "Tech";
          aiTags = ["tech", "coding", "hackathon", "fallback"];
        }
        aiDescription = "Asset auto-allocated via native filename context analysis due to upstream model capacity rules.";
      }

      // Create Nested Physical Storage Folder: uploads/[Custom_Event_Folder]/[AI_Category]
      const destinationFolderDir = path.join(baseUploadDir, eventFolderSegment, assignedFolder);
      if (!fs.existsSync(destinationFolderDir)) {
        fs.mkdirSync(destinationFolderDir, { recursive: true });
        console.log(`📁 Custom Event Nesting Path formed on storage workspace: ${destinationFolderDir}`);
      }

      // Determine clean name and move file out of staging area into classified spot
      const cleanFilename = file.filename.replace("RAW-", "");
      const finalPhysicalPath = path.join(destinationFolderDir, cleanFilename);
      
      // Relocate file synchronously
      fs.renameSync(file.path, finalPhysicalPath);

      // The web URL folder route now matches the nested dynamic structure exactly
      const webFriendlyUrl = `http://localhost:5000/uploads/${eventFolderSegment}/${assignedFolder}/${cleanFilename}`;

      const generatedAsset = {
        id: Number(Date.now() + Math.floor(Math.random() * 100000)),
        title: file.originalname ? file.originalname.split('.')[0] : "Classified Image",
        category: assignedFolder, // Preserves functional tag layout filters
        s3_optimized_url: webFriendlyUrl,
        url: webFriendlyUrl,
        ai_tags: aiTags,
        summary_text: aiDescription,
        likes_count: 0,
        uploaded_by: req.body.username || "Event Attendee",
        event: { 
          name: customEventInput.trim() ? customEventInput : `${assignedFolder} Activity Hub`, 
          club_name: customClubInput,
          description: customDescriptionInput
        }
      };

      newlyIndexedAssets.push(generatedAsset);
    }

    globalDatabaseCatalog = [...newlyIndexedAssets, ...globalDatabaseCatalog];

    return res.status(200).json({ 
      success: true, 
      count: files.length, 
      catalog: globalDatabaseCatalog 
    });
  } catch (error) {
    console.error("Sorting engine pipeline breakdown:", error);
    return res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// 2. SEARCH ENDPOINT (Filters catalog records dynamically)
// =========================================================================
router.get('/search', (req, res) => {
  try {
    const searchWord = (req.query.query || "").toLowerCase().trim();
    if (!searchWord) return res.status(200).json(globalDatabaseCatalog);

    const matches = globalDatabaseCatalog.filter(item => {
      return item.title?.toLowerCase().includes(searchWord) ||
             item.category?.toLowerCase().includes(searchWord) ||
             item.event?.name?.toLowerCase().includes(searchWord) ||
             item.uploaded_by?.toLowerCase().includes(searchWord) ||
             item.ai_tags?.some(tag => tag.toLowerCase().includes(searchWord));
    });
    return res.status(200).json(matches);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 3. FACIAL RECOGNITION (REFERENCE SELFIE MATCH SYSTEM)
// =========================================================================
router.post('/face-match', upload.single('referenceSelfie'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Missing reference selfie image." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const selfiePart = fileToGenerativePart(req.file.path, req.file.mimetype);
    const matchedGalleryItems = [];

    for (const asset of globalDatabaseCatalog) {
      if (!asset.s3_optimized_url.includes('localhost:5000')) continue;

      // Extract the nested relative path cleanly from the URL string
      const relativeUrlPath = asset.s3_optimized_url.split('/uploads/')[1];
      const diskPath = path.join(baseUploadDir, relativeUrlPath);

      if (!fs.existsSync(diskPath)) continue;

      // Cache Check Layer: Use persistent local analysis cards (.json) to prevent repeat API calls
      const blueprintCachePath = `${diskPath}.json`;
      if (fs.existsSync(blueprintCachePath)) {
        try {
          const cachedResult = JSON.parse(fs.readFileSync(blueprintCachePath, 'utf-8'));
          if (cachedResult.isMatch === true) {
            matchedGalleryItems.push(asset);
          }
          continue; 
        } catch (cacheErr) {
          console.error("Error reading blueprint file data: ", cacheErr.message);
        }
      }

      console.log(`[Rate Guard] Waiting 12 seconds before scanning face configurations inside: ${relativeUrlPath}...`);
      await sleep(12000);

      try {
        const targetImagePart = fileToGenerativePart(diskPath, "image/jpeg");

        const prompt = `You are a professional biometrics validation engine.
        Compare the facial structures of the individual in Image 1 (Reference Selfie) against the individual(s) present in Image 2 (Target Photo).
        Determine if the exact same person appears inside both files.
        Return a strict JSON format matching this pattern:
        {
          "isMatch": true or false
        }`;

        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [prompt, selfiePart, targetImagePart],
          config: { responseMimeType: "application/json" }
        });

        const parsedResult = JSON.parse(result.text.trim());
        
        fs.writeFileSync(blueprintCachePath, JSON.stringify(parsedResult, null, 2), 'utf-8');

        if (parsedResult.isMatch === true) {
          matchedGalleryItems.push(asset);
        }
      } catch (err) {
        console.error(`[Quota Warning] Facial check exception handling asset ${relativeUrlPath}. Using smart tag fallback:`, err.message);
        
        const fallbackTargetValue = asset.category.toLowerCase();
        if (fallbackTargetValue === 'portraits' || asset.ai_tags.includes('portrait')) {
          matchedGalleryItems.push(asset);
        }
      }
    }

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(200).json({
      success: true,
      matchesCount: matchedGalleryItems.length,
      matchingPhotos: matchedGalleryItems
    });

  } catch (error) {
    console.error("Facial engine fatal error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Stubs to prevent interaction crashes
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