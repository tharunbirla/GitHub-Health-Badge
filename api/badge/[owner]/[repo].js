export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  const { owner, repo } = req.query;
  if (!owner || !repo) {
    res.status(400).send('Missing owner or repo');
    return;
  }

  try {
    const healthUrl = `https://github-health-badge.vercel.app/api/health/${owner}/${repo}`;
    const response = await fetch(healthUrl);

    if (!response.ok) throw new Error(`Health fetch failed: ${response.status}`);
    const data = await response.json();
    const scoreValue = Number(data.healthScore) || 0;

    // Define colors based on score
    let valueColor = scoreValue >= 0.6 ? '#4c1' : scoreValue >= 0.3 ? '#dfb317' : '#e05d44';
    const labelColor = '#555';

    // Generate the SVG badge
    const badge = `
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="20">
        <!-- Label section -->
        <rect width="60" height="20" fill="${labelColor}" />
        <text x="30" y="14" fill="#fff" font-size="11" text-anchor="middle">Health</text>

        <!-- Value section -->
        <rect x="60" width="60" height="20" fill="${valueColor}" />
        <text x="90" y="14" fill="#fff" font-size="11" text-anchor="middle">Score ${scoreValue.toFixed(2)}</text>
      </svg>
    `.trim();

    // Send the SVG as the response
    res.send(badge);
  } catch (error) {
    // Fallback for errors: gray background with "Error" text
    const badge = `
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="20">
        <rect width="120" height="20" fill="#9f9f9f" />
        <text x="60" y="14" fill="#fff" font-size="11" text-anchor="middle">Error</text>
      </svg>
    `.trim();

    res.send(badge);
  }
}
