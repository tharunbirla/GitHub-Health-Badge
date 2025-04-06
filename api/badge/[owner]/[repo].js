import { createCanvas } from '@napi-rs/canvas';
import dotenv from 'dotenv';

dotenv.config();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { owner, repo } = req.query;
  
  if (!owner || !repo) {
    return res.status(400).send('Missing owner or repo in query');
  }

  try {
    // Use the full URL to your health endpoint
    const healthUrl = `https://github-health-badge.vercel.app/api/health/${owner}/${repo}`;
    console.log(`Fetching health data from: ${healthUrl}`);
    
    const response = await fetch(healthUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch health score: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Received health data:', JSON.stringify(data));
    
    const healthScore = data.healthScore;
    
    if (healthScore === undefined || healthScore === null) {
      throw new Error('Health score not found in response');
    }
    
    // Check if healthScore is a number
    const scoreValue = Number(healthScore);
    if (isNaN(scoreValue)) {
      throw new Error(`Invalid health score: ${healthScore}`);
    }
    
    // Choose color based on score
    let color;
    if (scoreValue >= 0.8) color = '#28a745';      // green
    else if (scoreValue >= 0.5) color = '#ffc107'; // yellow
    else color = '#dc3545';                        // red
    
    // Create canvas with dimensions that work well with the text
    const canvas = createCanvas(300, 50);
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 300, 50);
    
    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = `Health Score: ${scoreValue.toFixed(2)}`;
    ctx.fillText(text, 150, 25);
    
    // Send response
    res.setHeader('Content-Type', 'image/png');
    const buffer = canvas.toBuffer('image/png');
    res.send(buffer);
    
  } catch (error) {
    console.error('Error generating badge:', error);
    
    // Create an error badge instead of just returning a text error
    try {
      const canvas = createCanvas(300, 50);
      const ctx = canvas.getContext('2d');
      
      // Error background
      ctx.fillStyle = '#6c757d'; // gray
      ctx.fillRect(0, 0, 300, 50);
      
      // Error text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Error: Unable to calculate score', 150, 25);
      
      res.setHeader('Content-Type', 'image/png');
      res.send(canvas.toBuffer('image/png'));
    } catch (canvasError) {
      console.error('Failed to generate error badge:', canvasError);
      res.status(500).send('Error generating badge');
    }
  }
}
