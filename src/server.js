import express from 'express';
import { ENV } from './config/env.js';
import { db } from './config/db.js';
import { favoriteTable } from './db/schema.js';  

const app = express();
const PORT = ENV.PORT || 5001;

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({ success:true});
});

app.post("/api/favorites", async (req, res) => {
    try{
        const {userId, recipeId, title, image, cookTime, servings} = req.body;
        if(!userId || !recipeId || !title){
            return res.status(400).json({error: "Missing required fields"});
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
        console.log("Error adding favorite:", error);
        res.status(500).json({error: "Internal server error"});
    }
});


app.get("/api/favorites/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const userFavorites = await db.select().from(favoriteTable).where(favoriteTable.userId.eq(userId));
        res.status(200).json(userFavorites);
    } catch (error) {
        console.log("Error fetching favorites:", error);
        res.status(500).json({error: "Internal server error"});
    }
});





app.delete("/api/favorites/:userId/:recipeId", async (req, res) => {
    try {
        const { userId, recipeId } = req.params;
        
        await db.delete(favoriteTable)
            .where(favoriteTable.userId.eq(userId).and(favoriteTable.recipeId.eq(parseInt(recipeId))));
            res.status(204).json({message: "Favorite removed successfully"});
    } catch (error) {
        console.log("Error removing favorite:", error);
        res.status(500).json({error: "Internal server error"});
    }
});



app.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
});