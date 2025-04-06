import { createCanvas } from '@napi-rs/canvas';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
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
    res.status(400).send('Missing owner or repo in query');
    return;
  }

  const canvas = createCanvas(300, 60);
  const ctx = canvas.getContext('2d');

  try {
    const healthUrl = `https://github-health-badge.vercel.app/api/health/${owner}/${repo}`;
    const response = await fetch(healthUrl);
    
    console.log(`Health endpoint status: ${response.status}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Health endpoint error: ${response.status} - ${errorText}`);
      throw new Error(`Failed to fetch health score: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Health score data: ${JSON.stringify(data)}`);
    const healthScore = data.healthScore;
    
    if (healthScore === undefined || healthScore === null) {
      throw new Error('Health score not found in response');
    }
    
    const scoreValue = Number(healthScore);
    if (isNaN(scoreValue)) {
      throw new Error(`Invalid health score: ${healthScore}`);
    }
    
    console.log(`Health Score for ${owner}/${repo}: ${scoreValue}`);
    
    let bgColor;
    if (scoreValue >= 0.6) bgColor = '#28a745';      // green
    else if (scoreValue >= 0.3) bgColor = '#ffc107'; // yellow
    else bgColor = '#dc3545';                        // red
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 300, 60);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, 300, 60);
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = `Health Score: ${scoreValue.toFixed(2)}`;
    ctx.strokeText(text, 150, 30);
    ctx.fillText(text, 150, 30);
    
    res.setHeader('Content-Type', 'image/png');
    const buffer = canvas.toBuffer('image/png');
    console.log(`Buffer size: ${buffer.length} bytes`);
    res.send(buffer);
    
  } catch (error) {
    console.error('Error generating badge:', error);
    
    ctx.fillStyle = '#6c757d'; // gray
    ctx.fillRect(0, 0, 300, 60);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, 300, 60);
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.strokeText('Error: Unable to calculate', 150, 30);
    ctx.fillText('Error: Unable to calculate', 150, 30);
    
    res.setHeader('Content-Type', 'image/png');
    const buffer = canvas.toBuffer('image/png');
    console.log(`Error buffer size: ${buffer.length} bytes`);
    res.send(buffer);
  }
}
