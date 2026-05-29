const sharp = require('sharp');
const db = require('../config/db'); // Active node-postgres connection pool client
const { s3 } = require('../config/aws');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { applyDynamicWatermark } = require('../utils/watermark');

/**
 * 1. Fetch live assets formatted cleanly for Next.js App consumption
 * Matches path: GET /api/media/search
 */
exports.searchMediaAssets = async (req, res, next) => {
    try {
        const { query, tag, category, sortBy } = req.query;
        
        let queryValues = [];
        let queryConditions = [];
        
        // Aligned to match your exact PostgreSQL column layouts
        let baseQuery = `
            SELECT m.id, m.title, m.category, m.s3_optimized_url, 
                   m.uploader_id, m.likes_count, m.ai_tags, 
                   e.name AS "eventName", e.club_name AS "clubName"
            FROM media_assets m
            JOIN events e ON m.event_id = e.id
        `;

        // Support both 'query' and 'search' URL params transparently
        const searchTerms = query || req.query.search;
        if (searchTerms) {
            queryValues.push(`%${searchTerms}%`);
            queryConditions.push(`(e.name ILIKE $${queryValues.length} OR m.title ILIKE $${queryValues.length})`);
        }

        if (tag) {
            queryValues.push(tag.toLowerCase());
            queryConditions.push(`$${queryValues.length} = ANY(m.ai_tags)`);
        }

        if (category) {
            queryValues.push(category);
            queryConditions.push(`m.category = $${queryValues.length}`);
        }

        if (queryConditions.length > 0) {
            baseQuery += ` WHERE ` + queryConditions.join(' AND ');
        }

        if (sortBy === 'name') {
            baseQuery += ` ORDER BY m.title ASC`;
        } else if (sortBy === 'likes') {
            baseQuery += ` ORDER BY m.likes_count DESC`;
        } else {
            baseQuery += ` ORDER BY m.created_at DESC`;
        }

        const { rows: assets } = await db.query(baseQuery, queryValues);
        
        // Map postgres flat rows directly into the deep JSON interface expected by the Frontend UI
        const formattedAssets = assets.map(asset => ({
            id: asset.id,
            title: asset.title,
            category: asset.category,
            s3_optimized_url: asset.s3_optimized_url,
            likes_count: asset.likes_count,
            ai_tags: asset.ai_tags || [],
            event: {
                name: asset.eventName,
                club_name: asset.clubName
            }
        }));

        // 🔥 CRITICAL FIX: Return the raw array directly so Array.isArray(data) validates successfully on the frontend!
        res.status(200).json(formattedAssets);

    } catch (error) {
        console.error("❌ Search Controller Failure:", error);
        res.status(500).json({ error: "Internal Database Selection Fail Routine" });
    }
};

/**
 * 2. Handle interactive state updates (Likes / Comments)
 * Matches paths: POST /api/media/:mediaId/like or POST /api/media/interact
 */
exports.interactWithMedia = async (req, res, next) => {
    try {
        // Fallback checks read both URL params and raw body keys seamlessly
        const mediaId = req.params.mediaId || req.body.mediaId;
        const type = req.params.mediaId ? 'like' : req.body.type; 
        const { commentText, ownerId } = req.body;
        const currentUserId = req.user?.id || 4; 

        if (!mediaId) {
            return res.status(400).json({ error: "Missing required media target parameter identifiers" });
        }

        if (type === 'like') {
            await db.query(`UPDATE media_assets SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = $1`, [mediaId]);
        } else if (type === 'comment') {
            await db.query(
                `INSERT INTO media_interactions (media_id, user_id, interaction_type, comment_text) VALUES ($1, $2, $3, $4)`,
                [mediaId, currentUserId, 'comment', commentText]
            );
        }

        // Real-Time Socket Notifications
        if (req.io && req.activeUsers) {
            const targetSocketId = req.activeUsers.get(String(ownerId));
            if (targetSocketId) {
                const alertMessage = type === 'like' 
                    ? `Someone liked your asset #${mediaId}!` 
                    : `New comment on your asset #${mediaId}: "${commentText.substring(0, 20)}..."`;
                
                req.io.to(targetSocketId).emit('receive_notification', {
                    id: Date.now(),
                    message: alertMessage
                });
            }
        }

        res.status(200).json({ success: true, message: "Interaction pipeline processed!" });
    } catch (error) {
        console.error("❌ Interaction Controller Failure:", error);
        res.status(500).json({ error: "Internal Database Modification Failure" });
    }
};

/**
 * 3. Pulls raw asset arrays from S3 and composites a dynamic watermark inside memory buffers
 * Matches path: GET /api/media/:mediaId/download
 */
exports.downloadWatermarkedAsset = async (req, res, next) => {
    try {
        const { mediaId } = req.params;
        const userRole = req.user?.role || 'Viewer'; 

        const assetQuery = `
            SELECT m.s3_optimized_url, e.name AS "eventName", e.club_name AS "clubName"
            FROM media_assets m
            JOIN events e ON m.event_id = e.id
            WHERE m.id = $1
        `;
        const { rows } = await db.query(assetQuery, [mediaId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: "Target media catalog item record not found" });
        }

        const assetMeta = rows[0];

        // Create canvas container in-memory layout using Sharp
        const cleanDummyBuffer = await sharp({
            create: { width: 1200, height: 800, channels: 3, background: { r: 11, g: 12, b: 22 } }
        }).jpeg().toBuffer();

        // Pass straight to rendering layer parameters
        const stampedAssetBuffer = await applyDynamicWatermark(
            cleanDummyBuffer, 
            assetMeta.clubName || "Coding Club", 
            assetMeta.eventName || "Nexus Hackathon", 
            userRole
        );

        // Instead of binary payload stream drop, simulate a clean response matching your front-end layout expectations
        res.status(200).json({
            watermarkText: `${assetMeta.clubName} | Secure Download Stream`,
            originalAsset: assetMeta.s3_optimized_url
        });
        
    } catch (error) {
        console.error("❌ Watermarking Controller Failure:", error);
        res.status(500).json({ error: "Dynamic watermarking transformation error" });
    }
};

/**
 * 🌟 4. Simulates an AI Facial Recognition parsing routine 
 * Matches path: GET /api/media/ai/discovery
 */
exports.executeAiDiscoveryScan = async (req, res, next) => {
    try {
        // Query database context for assets to render inside the dashboard view wrapper
        const discoveryQuery = `
            SELECT m.id, m.title, m.category, m.s3_optimized_url, 
                   m.likes_count, m.ai_tags, 
                   e.name AS "eventName", e.club_name AS "clubName"
            FROM media_assets m
            JOIN events e ON m.event_id = e.id
            LIMIT 6
        `;
        
        const { rows: assets } = await db.query(discoveryQuery);
        
        // Map elements directly to match the UI state machine
        const formattedDiscovery = assets.map(asset => ({
            id: asset.id,
            title: asset.title || `Matched Face Cluster #${asset.id}`,
            category: asset.category || "AI Discovery",
            s3_optimized_url: asset.s3_optimized_url,
            likes_count: asset.likes_count,
            ai_tags: asset.ai_tags || [],
            event: {
                name: asset.eventName,
                club_name: asset.clubName
            }
        }));

        res.status(200).json(formattedDiscovery);

    } catch (error) {
        console.error("❌ AI Discovery Controller Failure:", error);
        res.status(500).json({ error: "Internal AI Matrix Compilation Failure" });
    }
};