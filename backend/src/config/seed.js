const dotenv = require('dotenv');
dotenv.config(); // 🔥 CRITICAL: Must be called before importing the database module

const db = require('./db');

async function runDatabaseSeeder() {
  console.log("⏳ Initializing database mock seeder routine...");
  try {
    // 1. Clear old logs to prevent duplicate key errors
    await db.query(`TRUNCATE media_interactions, media_assets, events CASCADE;`);
    console.log("✨ Cleared old platform records clean.");

    // 2. Populate an active baseline Event
    const eventInsertQuery = `
      INSERT INTO events (id, name, description, club_name, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id;
    `;
    const eventValues = [1, 'Nexus National Hackathon 2026', 'Annual 36-hour build sprint.', 'Coding Club Core'];
    const { rows: eventRows } = await db.query(eventInsertQuery, eventValues);
    const eventId = eventRows[0].id;
    console.log(`✅ Seeded test Event ID: ${eventId}`);

    // 3. Populate mock Media Assets with AI Tags
    const assetsToSeed = [
      {
        title: 'Opening Keynote Address',
        category: 'Workshop',
        s3_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60',
        tags: ['presentation', 'tech', 'main stage']
      },
      {
        title: 'Project Prototyping Rush',
        category: 'Competition',
        s3_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60',
        tags: ['tech', 'crowd']
      },
      {
        title: 'Team Evaluation Round',
        category: 'Competition',
        s3_url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=60',
        tags: ['presentation', 'outdoor']
      },
      {
        title: 'Grand Finale Group Picture',
        category: 'Photoshoot',
        s3_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60',
        tags: ['crowd', 'main stage']
      }
    ];

    const assetInsertQuery = `
      INSERT INTO media_assets (title, category, s3_optimized_url, uploader_id, event_id, likes_count, ai_tags, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());
    `;

    for (const asset of assetsToSeed) {
      await db.query(assetInsertQuery, [
        asset.title,
        asset.category,
        asset.s3_url,
        4, // Matches your currentUserId = 4 mock logic
        eventId,
        Math.floor(Math.random() * 20) + 5, // Random initial likes
        asset.tags
      ]);
    }

    console.log(`🚀 Seeder finished! Populated ${assetsToSeed.length} mockup rows.`);
  } catch (error) {
    console.error("❌ Seeder failure:", error);
  } finally {
    process.exit();
  }
}

runDatabaseSeeder();