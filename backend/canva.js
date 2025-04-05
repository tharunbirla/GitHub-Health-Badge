const express = require('express');
const axios = require('axios');
const canvas = require('canvas');
const { createCanvas } = canvas;

const app = express();

// Endpoint to fetch health score and generate a badge
app.get('/api/badge/:owner/:repo', async (req, res) => {
    const { owner, repo } = req.params;

    try {
        // Fetch repository health from your existing API
        const response = await axios.get(`http://localhost:3000/api/health/${owner}/${repo}`);

        // Log the full response data to understand its structure
        console.log(response.data);

        // Get health score from the response
        const healthScore = response.data.healthScore; // Extract health score

        if (healthScore === undefined) {
            // If no health score is found, respond with an error
            res.status(400).send('Health score not found in response');
            return;
        }

        // Define badge color based on health score
        let color;
        if (healthScore >= 0.7) {
            color = '#28a745'; // Green for healthy
        } else {
            color = '#dc3545'; // Red for unhealthy
        }

        // Set up canvas for the badge image
        const canvasWidth = 300;
        const canvasHeight = 50;
        const canvasInstance = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvasInstance.getContext('2d');

        // Set background color based on health score
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Set text properties
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw the health score as text in the center
        ctx.fillText(`Health Score: ${healthScore}`, canvasWidth / 2, canvasHeight / 2);

        // Send the image as a response
        res.set('Content-Type', 'image/png');
        res.send(canvasInstance.toBuffer());
    } catch (error) {
        console.error('Error fetching health status:', error);
        res.status(500).send('Error generating badge');
    }
});

// Start the server
const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
