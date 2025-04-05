import { createCanvas } from '@napi-rs/canvas';
import axios from 'axios';

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
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const url = `${baseUrl}/api/health/${owner}/${repo}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/json',
      },
    });

    const healthScore = response.data.healthScore;

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
    res.status(500).send('Error generating badge');
  }
}
