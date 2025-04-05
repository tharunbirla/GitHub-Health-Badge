import axios from 'axios';
import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');

  if (!owner || !repo) {
    return new Response('Missing owner or repo', { status: 400 });
  }

  // Automatically construct base URL (supports both Vercel and localhost)
  const baseURL = req.headers.get('host').startsWith('localhost')
    ? `http://${req.headers.get('host')}`
    : `https://${req.headers.get('host')}`;

  let healthData;

  try {
    const response = await axios.get(`${baseURL}/api/health/${owner}/${repo}`);
    healthData = response.data;
  } catch (err) {
    console.error('Error fetching health data:', err);
    return new Response('Failed to fetch health data', { status: 500 });
  }

  const score = healthData.healthScore || 0;

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 28,
          background: '#0f172a',
          color: '#f1f5f9',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
        }}
      >
        GitHub Health Score: {score}/100
      </div>
    ),
    {
      width: 400,
      height: 100,
    }
  );
}
