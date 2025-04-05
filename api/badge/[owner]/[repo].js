import { createCanvas } from '@napi-rs/canvas';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();


const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { owner, repo } = req.query;

  try {
    
    const response = await fetch(`https://github-health-badge.vercel.app/api/health/${owner}/${repo}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Fetch failed: ${response.status} - ${errText}`);
    }
    
    const data = await response.json();
    const healthScore = data.healthScore;


    if (healthScore === undefined) {
      return res.status(400).send('Health score not found in response');
    }

    const color = healthScore >= 0.7 ? '#28a745' : '#dc3545';

    const canvas = createCanvas(300, 50);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 300, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Health Score: ${healthScore}`, 150, 25);

    res.setHeader('Content-Type', 'image/png');
    res.send(canvas.toBuffer());

  } catch (error) {
    console.error('Error generating badge:', error.message);
    console.log(response)
    res.status(500).send('Error generating badge');
  }
}
