# 🩺 GitHub Health Badge

[![Repository Health](https://github-health-badge.vercel.app/api/badge/facebook/react)](https://github.com/facebook/react)

Generate beautiful and live **repository health badges** for any public GitHub repository!  
Perfect for adding to your README to instantly show how actively maintained or healthy a project is.

---

## 🚀 What Is This?

This project visualizes GitHub repository health using a **custom image badge** that displays a health score (based on commit activity, PR/issue responsiveness, contributor diversity, etc.).

Built with:

- 🖌️ [`@napi-rs/canvas`](https://github.com/Brooooooklyn/canvas) for rendering badges.
- ⚙️ Express API to calculate health.
- 🌐 Axios to fetch health scores from your own backend.

---

## 🔧 Usage

Embed a badge in any markdown file like this:

```md
![Repository Health](https://github-health-badge.vercel.app/api/badge/<owner>/<repo>)
```

**Example**:

```md
![Repository Health](https://github-health-badge.vercel.app/api/badge/facebook/react)
```

You can click the badge to view the GitHub repository:

```md
[![Repository Health](https://github-health-badge.vercel.app/api/badge/facebook/react)](https://github.com/facebook/react)
```

---

## 🛠 Backend Requirement

This badge service depends on a backend API that calculates and returns a health score JSON like:

```json
{
  "healthScore": 0.83
}
```

You must either:

1. Deploy your own backend and set the URL via `.env`:

```env
BACKEND_URL=https://your-backend.com
```

2. Or use the default service if provided.

---

## 📁 Project Structure

```
📦 github-health-badge
├── api/
│   └── badge.js         # Vercel Serverless Function
├── backend/
│   ├── index.js         # Express server to calculate health
│   └── canva.js         # (Optional) canvas test setup
├── .env                 # Environment variable for BACKEND_URL
├── package.json
└── vercel.json          # Optional deployment config
```

---

## 🧪 Local Development

```bash
# Install dependencies
npm install

# Start backend (port 3000)
cd backend && node index.js

# Start Vercel dev for frontend (badge API)
cd ..
vercel dev
```

---

## 🌍 Live Deployment

The badge is deployed on **Vercel**:

```
https://github-health-badge.vercel.app/api/badge/<owner>/<repo>
```

---

## 🙌 Author

Built with ❤️ by [@tharunbirla](https://github.com/tharunbirla)

---

## 📜 License

MIT

---

### ✅ What's Next?

You can now:

1. **Create a GitHub repo** called `github-health-badge`.
2. Push this project.
3. Copy the above README into `README.md`.
4. Deploy to Vercel (if not already done).
5. Share your repo and let others use it!

Need help writing the backend health score logic or styling the badge further? Just say the word!