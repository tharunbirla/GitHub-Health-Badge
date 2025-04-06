# 🩺 GitHub Health Badge

Generate live **repository health badges** for any public GitHub repository! Perfect for adding to your README to showcase how actively maintained or healthy a project is.

[![Repository Health](https://github-health-badge.vercel.app/api/badge/facebook/react)](https://github.com/tharunbila/GitHub-Health-Badge)

---

## 🚀 What Is This?

This project provides two main functionalities:

1. **Health Score API**: Calculates a health score for a GitHub repository based on metrics such as:
   - Issue response time
   - PR merge time
   - Commit frequency
   - Contributor activity
   - Issue close rate
   - Codebase growth
   - Documentation quality

2. **Dynamic Badges**: Generates beautiful and dynamic badges that visualize the calculated health score.

---

## 🔧 Usage

### 1. Health Score API

Fetch the health score of a GitHub repository by making a GET request to:

```
https://github-health-badge.vercel.app/api/health/<owner>/<repo>
```

**Example**:

```
https://github-health-badge.vercel.app/api/health/facebook/react
```

**Response**:

```json
{
  "repoName": "react",
  "repoOwner": "facebook",
  "healthScore": 0.83,
  "metrics": {
    "issuesResponseTime": {
      "score": 0.8,
      "value": "2.5 days",
      "description": "Average time to respond to issues: 2.5 days"
    },
    "prMergeTime": {
      "score": 0.6,
      "value": "7.2 days",
      "description": "Average time to merge PRs: 7.2 days"
    },
    "commitFrequency": {
      "score": 1,
      "value": "25 commits/week",
      "description": "Average weekly commits: 25"
    },
    "contributorCount": {
      "score": 0.8,
      "value": "15/20 active",
      "description": "15 active out of 20 total contributors"
    },
    "issueCloseRate": {
      "score": 0.9,
      "value": "90%",
      "description": "Issue close rate: 90%"
    },
    "codebaseGrowth": {
      "score": 0.8,
      "value": "50 commits",
      "description": "Total commits: 50"
    },
    "documentationScore": {
      "score": 1,
      "value": "README found",
      "description": "The repository has a README file."
    }
  },
  "updatedAt": "2023-10-04T12:34:56Z"
}
```

### 2. Dynamic Badges

Embed a badge in your markdown files like this:

```markdown
![Repository Health](https://github-health-badge.vercel.app/api/badge/<owner>/<repo>)
```

**Example**:

```markdown
![Repository Health](https://github-health-badge.vercel.app/api/badge/facebook/react)
```

Make it clickable by linking it to the repository:

```markdown
[![Repository Health](https://github-health-badge.vercel.app/api/badge/facebook/react)](https://github.com/facebook/react)
```

---

## 🛠 Backend Requirements

The health score API depends on a backend service that fetches data from the GitHub API. Ensure you have:

1. A valid **GitHub Personal Access Token** (PAT) with `repo` scope.
2. Set the token in the `.env` file:

   ```env
   GITHUB_TOKEN=your-github-personal-access-token
   ```

If no token is provided, the default GitHub API rate limits will apply.

---

## 📁 Project Structure

```
📦 github-health-badge
├── api/
│   └── health
|   |   └── [owner]
|   |       └── [repo].js # Vercel Serverless Function for health score 
|   |
│   └── badge
|       └── [owner]
|           └── [repo].js # Vercel Serverless Function for badge generation
|
├── .env                 # Environment variable for GITHUB_TOKEN
├── package.json
└── vercel.json          # Deployment configuration
```

---

## 🧪 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Environment Variables**:
   Create a `.env` file with your GitHub token:
   ```env
   GITHUB_TOKEN=your-github-personal-access-token
   ```

3. **Start the API Locally**:
   ```bash
   npm run dev
   ```

4. Test the health API:
   ```
   http://localhost:3000/api/health/<owner>/<repo>
   ```

5. Test the badge API:
   ```
   http://localhost:3000/api/badge/<owner>/<repo>
   ```

---

## 🌍 Live Deployment

The badge and health APIs are deployed on **Vercel**:

- Health API:
  ```
  https://github-health-badge.vercel.app/api/health/<owner>/<repo>
  ```

- Badge API:
  ```
  https://github-health-badge.vercel.app/api/badge/<owner>/<repo>
  ```

Replace `<owner>` and `<repo>` with the GitHub repository details.

---

## 🙌 Author

Built with ❤️ by [@tharunbirla](https://github.com/tharunbirla)

---

## 📜 License

MIT
