import { ImageResponse } from '@vercel/og';
import axios from 'axios';

export default async function handler(req, res) {
  const { owner, repo } = req.query;

  if (!owner || !repo) {
    return res.status(400).send('Missing owner or repo');
  }

  const baseURL = req.headers.host.startsWith('localhost')
    ? `http://${req.headers.host}`
    : `https://${req.headers.host}`;

  try {
    try {
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        });
    const { healthScore } = response.data;
    } catch (err) {
        console.error('GitHub API error:', err?.response?.data || err.message);
        return res.status(500).json({ error: 'Failed to fetch GitHub data' });
    }

    const image = new ImageResponse(
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
          GitHub Health Score: {healthScore}/100
        </div>
      ),
      {
        width: 400,
        height: 100,
      }
    );

    res.setHeader('Content-Type', 'image/png');
    res.status(200).end(await image.arrayBuffer());
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Error generating badge');
  }
}
