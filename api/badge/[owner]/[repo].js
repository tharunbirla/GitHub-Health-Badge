import { createCanvas } from '@napi-rs/canvas';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  const { owner, repo } = req.query;
  if (!owner || !repo) {
    res.status(400).send('Missing owner or repo');
    return;
  }

  const canvas = createCanvas(300, 60);
  const ctx = canvas.getContext('2d');

  try {
    const healthUrl = `https://github-health-badge.vercel.app/api/health/${owner}/${repo}`;
    const response = await fetch(healthUrl);
    if (!response.ok) throw new Error(`Health fetch failed: ${response.status}`);

    const data = await response.json();
    const scoreValue = Number(data.healthScore) || 0;

    let bgColor = scoreValue >= 0.6 ? '#28a745' : scoreValue >= 0.3 ? '#ffc107' : '#dc3545';
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 300, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Health Score: ${scoreValue.toFixed(2)}`, 150, 30);

    const buffer = canvas.toBuffer('image/png');
    console.log(`Buffer size: ${buffer.length} bytes`);
    res.send(buffer);
  } catch (error) {
    console.error('Error:', error);
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(0, 0, 300, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Error', 150, 30);

    const buffer = canvas.toBuffer('image/png');
    console.log(`Error buffer size: ${buffer.length} bytes`);
    res.send(buffer);
  }
}

// Ensure Node.js runtime
export const config = {
  runtime: 'nodejs',
};
