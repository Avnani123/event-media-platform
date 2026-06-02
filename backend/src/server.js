const express = require('express');
const cors = require('cors');
const path = require('path'); 
const fs = require('fs'); 
const mediaRoutes = require('./routes/mediaRoutes');


const app = express();
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
// Configure CORS for Next.js frontend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inside your server.js - looking one level up from the src/ folder
const absoluteUploadsPath = path.join(__dirname, '../uploads');

if (!fs.existsSync(absoluteUploadsPath)) {
  fs.mkdirSync(absoluteUploadsPath, { recursive: true });
}

// Serve uploaded binaries straight over HTTP
app.use('/uploads', express.static(absoluteUploadsPath));

// API Gateway Mounting
app.use('/api/media', mediaRoutes);

// Explicit 404 JSON response instead of default Express HTML pages
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}. Verify your endpoint string configuration.` });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`📂 Static assets exposed securely from: ${absoluteUploadsPath}`);
});