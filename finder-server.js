const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

const MIN_PLACE_ID = 10000000;
const MAX_PLACE_ID = 1700000000;
const MAX_RETRIES = 15;

async function getGameInfo(placeId) {
    const url = `https://games.roblox.com/v1/games?universeIds=${placeId}`;

    const starterPlaceDescriptions = [
        "this is your very first roblox creation. check it out, then make it your own with roblox studio!",
        "this is your very first roblox creation. check it out, then make it your own with roblox studio!" // both are same when lowercased
    ];

    try {
        const response = await axios.get(url);
        const data = response.data.data[0];

        // Normalize the description
        const desc = (data.description || "").trim().toLowerCase();

        if (
            !data ||
            !data.name ||
            data.isPlayable === false ||
            starterPlaceDescriptions.includes(desc)
        ) {
            throw new Error("Game is a starter place or unplayable.");
        }

        return {
            id: data.rootPlaceId,
            name: data.name,
            description: data.description || "No description",
            url: `https://www.roblox.com/games/${data.rootPlaceId}`,
            creator: data.creator?.name || "Unknown",
            playing: data.playing || 0
        };

    } catch (error) {
        throw new Error(`Invalid game or fetch error.`);
    }
}

async function getRandomGame() {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const randomId = Math.floor(Math.random() * (MAX_PLACE_ID - MIN_PLACE_ID)) + MIN_PLACE_ID;
        try {
            return await getGameInfo(randomId);
        } catch {
            // try again
        }
    }
    throw new Error("Failed to find a valid game.");
}

app.get("/random-game", async (req, res) => {
    try {
        const game = await getRandomGame();
        res.json(game);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}/random-game`);
});
