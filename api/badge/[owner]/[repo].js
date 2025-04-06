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

  const canvas = createCanvas(200, 30);
  const ctx = canvas.getContext('2d');

  try {
    const healthUrl = `https://github-health-badge.vercel.app/api/health/${owner}/${repo}`;
    const response = await fetch(healthUrl);

    if (!response.ok) throw new Error(`Health fetch failed: ${response.status}`);
    const data = await response.json();
    const scoreValue = Number(data.healthScore) || 0;

    // Define colors based on score
    let valueColor = scoreValue >= 0.6 ? '#4c1' : scoreValue >= 0.3 ? '#dfb317' : '#e05d44';
    const labelColor = '#555';

    // Draw label section
    ctx.fillStyle = labelColor;
    ctx.fillRect(0, 0, 65, 30);

    // Draw value section
    ctx.fillStyle = valueColor;
    ctx.fillRect(65, 0, 135, 30);

    // Set up text properties
    ctx.font = 'bold 11px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';

    // Draw label text
    ctx.textAlign = 'center';
    ctx.fillText('Health', 32, 15);

    // Draw value text
    ctx.textAlign = 'start';
    ctx.fillText(`Score ${scoreValue.toFixed(2)}`, 75, 15);

    // Send the image buffer as the response
    const buffer = canvas.toBuffer('image/png');
    res.send(buffer);
  } catch (error) {
    // Fallback for errors: gray background with "Error" text
    ctx.fillStyle = '#9f9f9f';
    ctx.fillRect(0, 0, 200, 30);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Error', 100, 15);

    const buffer = canvas.toBuffer('image/png');
    res.send(buffer);
  }
}
