import express from 'express';
import cors from 'cors'; // Added CORS for mobile connectivity
import { eq, and } from 'drizzle-orm'; // Added required Drizzle operators
import { ENV } from './config/env.js';
import { db } from './config/db.js';
import { favoriteTable } from './db/schema.js';  
import job from "./config/cron.js";

const app = express();
const PORT = ENV.PORT || 5001;

// Middlewares
app.use(cors()); // Enable CORS so mobile app can connect
app.use(express.json());

if (ENV.NODE_ENV === "production") {
  job.start(); 
}

// Health Check
app.get("/api/health", (req, res) => {
    res.status(200).json({ success: true });
});

// POST: Add a favorite
app.post("/api/favorites", async (req, res) => {
    try {
        const { userId, recipeId, title, image, cookTime, servings } = req.body;
        if (!userId || !recipeId || !title) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newFavorite = await db.insert(favoriteTable).values({
            userId,
            recipeId,
            title,
            image,
            cookTime,
            servings
        }).returning();

        res.status(201).json(newFavorite[0]);
    } catch (error) {
        console.error("Error adding favorite:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET: Fetch user favorites
app.get("/api/favorites/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        
        // FIXED: Corrected Drizzle v0.30+ query syntax
        const userFavorites = await db.select()
            .from(favoriteTable)
            .where(eq(favoriteTable.userId, userId));
            
        res.status(200).json(userFavorites);
    } catch (error) {
        console.error("Error fetching favorites:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// DELETE: Remove a favorite
app.delete("/api/favorites/:userId/:recipeId", async (req, res) => {
    try {
        const { userId, recipeId } = req.params;
        
        // FIXED: Corrected Drizzle v0.30+ delete syntax with logical 'and'
        await db.delete(favoriteTable)
            .where(
                and(
                    eq(favoriteTable.userId, userId),
                    eq(favoriteTable.recipeId, parseInt(recipeId))
                )
            );
            
        res.status(204).send(); // 204 No Content is standard for successful deletes
    } catch (error) {
        console.error("Error removing favorite:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on PORT: ${PORT}`);
});