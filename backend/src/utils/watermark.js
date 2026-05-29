const sharp = require('sharp');

/**
 * Superimposes a dynamic semi-translucent security watermark text layer onto an image buffer
 * @param {Buffer} imageBuffer - The clean source image binary buffer fetched from S3
 * @param {string} clubName - Name of the hosting club/society
 * @param {string} eventName - Name of the active event catalog
 * @param {string} userRole - Access role of the downloading user (Admin, Photographer, Viewer)
 */
exports.applyDynamicWatermark = async (imageBuffer, clubName, eventName, userRole) => {
    try {
        // 1. Inspect metadata metrics of incoming image asset
        const metadata = await sharp(imageBuffer).metadata();
        const width = metadata.width || 1920;
        const height = metadata.height || 1080;

        // 2. Draft dynamic contextual overlay string metrics
        const watermarkText = `© ${clubName} | ${eventName} - Downloaded by [${userRole}]`;

        // 3. Generate a dynamic SVG graphic vector container matching structural bounds
        const svgWidth = Math.floor(width * 0.8);
        const fontSize = Math.floor(width / 35); // Scales fluidly relative to image size

        const svgWatermark = `
            <svg width="${width}" height="${height}">
                <style>
                    .watermark-text {
                        font-family: 'Helvetica Neue', Arial, sans-serif;
                        font-size: ${fontSize}px;
                        font-weight: bold;
                        fill: rgba(255, 255, 255, 0.35); /* Translucent text overlay */
                        text-anchor: middle;
                    }
                    .shadow-text {
                        font-family: 'Helvetica Neue', Arial, sans-serif;
                        font-size: ${fontSize}px;
                        font-weight: bold;
                        fill: rgba(0, 0, 0, 0.2);
                        text-anchor: middle;
                    }
                </style>
                <text x="${width / 2 + 2}" y="${height - 50 + 2}" class="shadow-text">${watermarkText}</text>
                <text x="${width / 2}" y="${height - 50}" class="watermark-text">${watermarkText}</text>
            </svg>
        `;

        // 4. Composite the vector layer array onto the master raster buffer stream
        const watermarkedImageBuffer = await sharp(imageBuffer)
            .composite([{
                input: Buffer.from(svgWatermark),
                top: 0,
                left: 0
            }])
            .jpeg({ quality: 85 }) // Maintain optimal file weights
            .toBuffer();

        return watermarkedImageBuffer;
    } catch (error) {
        console.error("Watermark generation fault intercepted:", error);
        throw error;
    }
};
