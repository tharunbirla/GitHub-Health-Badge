import { createCanvas } from '@napi-rs/canvas';
import dotenv from 'dotenv';

dotenv.config();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export default async function handler(req, res) {
  // CORS headers remain the same
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
    const healthUrl = `https://github-health-badge.vercel.app/api/health/${owner}/${repo}`;
    const response = await fetch(healthUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch health score: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
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
    let bgColor;
    if (scoreValue >= 0.8) bgColor = '#28a745';      // green
    else if (scoreValue >= 0.5) bgColor = '#ffc107'; // yellow
    else bgColor = '#dc3545';                        // red
    
    // Create canvas with dimensions
    const canvas = createCanvas(300, 60);
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 300, 60);
    
    // Add a dark semi-transparent overlay for better contrast
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, 300, 60);
    
    // Draw white text with black outline for maximum visibility
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = `Health Score: ${scoreValue.toFixed(2)}`;
    ctx.strokeText(text, 150, 30); // Draw text outline first
    ctx.fillText(text, 150, 30);   // Then fill with white
    
    // Send response
    res.setHeader('Content-Type', 'image/png');
    const buffer = canvas.toBuffer('image/png');
    res.send(buffer);
    
  } catch (error) {
    console.error('Error generating badge:', error);
    
    // Create an error badge
    try {
      const canvas = createCanvas(300, 60);
      const ctx = canvas.getContext('2d');
      
      // Error background
      ctx.fillStyle = '#6c757d'; // gray
      ctx.fillRect(0, 0, 300, 60);
      
      // Add dark overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, 300, 60);
      
      // Error text with outline
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.strokeText('Error: Unable to calculate score', 150, 30);
      ctx.fillText('Error: Unable to calculate score', 150, 30);
      
      res.setHeader('Content-Type', 'image/png');
      res.send(canvas.toBuffer('image/png'));
    } catch (canvasError) {
      console.error('Failed to generate error badge:', canvasError);
      res.status(500).send('Error generating badge');
    }
  }
}
