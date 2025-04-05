import { createCanvas } from '@napi-rs/canvas';
import axios from 'axios';

export default async function handler(req, res) {
  const {
    query: { owner, repo },
  } = req;

  const BACKEND_URL = process.env.BACKEND_URL;

  try {
    const response = await axios.get(`${BACKEND_URL}/api/health/${owner}/${repo}`);
    const healthScore = response.data.healthScore;

    if (healthScore === undefined) {
      return res.status(400).send('Health score not found in response');
    }

    const color = healthScore >= 0.7 ? '#28a745' : '#dc3545';
    const canvas = createCanvas(300, 50);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 300, 50);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Health Score: ${healthScore}`, 150, 25);

    res.setHeader('Content-Type', 'image/png');
    res.send(canvas.toBuffer());
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error generating badge');
  }
}
