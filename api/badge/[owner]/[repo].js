import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, 'http://localhost');
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');

  if (!owner || !repo) {
    return new ImageResponse(<div>Missing owner or repo</div>, { status: 400 });
  }

  try {
    const healthUrl = `https://github-health-badge.vercel.app/api/health/${owner}/${repo}`;
    const response = await fetch(healthUrl);
    if (!response.ok) throw new Error('Health fetch failed');
    
    const data = await response.json();
    const scoreValue = Number(data.healthScore) || 0;
    const bgColor = scoreValue >= 0.6 ? '#28a745' : scoreValue >= 0.3 ? '#ffc107' : '#dc3545';

    return new ImageResponse(
      (
        <div
          style={{
            width: '300px',
            height: '60px',
            backgroundColor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          Health Score: {scoreValue.toFixed(2)}
        </div>
      ),
      {
        width: 300,
        height: 60,
      }
    );
  } catch (error) {
    return new ImageResponse(
      (<div style={{ width: '300px', height: '60px', backgroundColor: '#6c757d', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Error</div>),
      { width: 300, height: 60 }
    );
  }
}
