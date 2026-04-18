```
 ██████╗ ██╗████████╗██████╗ ███╗   ██╗ █████╗
██╔════╝ ██║╚══██╔══╝██╔══██╗████╗  ██║██╔══██╗
██║  ███╗██║   ██║   ██║  ██║██╔██╗ ██║███████║
██║   ██║██║   ██║   ██║  ██║██║╚██╗██║██╔══██║
╚██████╔╝██║   ██║   ██████╔╝██║ ╚████║██║  ██║
 ╚═════╝ ╚═╝   ╚═╝   ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝
```

Your code has a fingerprint. We read it.

[![GitHub stars](https://img.shields.io/github/stars/Aanishnithin07/gitdna?style=for-the-badge)](https://github.com/Aanishnithin07/gitdna/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](./LICENSE)
[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Powered by Groq](https://img.shields.io/badge/Powered%20by-Groq-F55036?style=for-the-badge)](https://console.groq.com/)
[![Deploy on Vercel](https://img.shields.io/badge/Deploy%20on-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/Aanishnithin07/gitdna)

![GitDNA Demo](./docs/demo.gif)



## What Is GitDNA

GitHub profiles are mostly static stats: stars, repos, followers, and a sea of green squares. They tell you what happened, not how someone builds, ships, collaborates, or burns out. The most interesting signal on GitHub is behavior, and behavior is buried in events, commit language, timing, consistency, and execution style.

GitDNA turns public GitHub activity into behavioral intelligence. It analyzes patterns, generates a developer archetype, maps working rhythm, scores traits, and surfaces insights through a cinematic frontend. It feels less like reading a profile and more like decoding a builder.

## Features

| Feature | Description |
|---|---|
| 🧬 Developer DNA Scan | Generates an AI-backed personality and coding archetype from live GitHub telemetry. |
| 🧠 Neural Traits Radar | Visual trait profile for creativity, discipline, collaboration, boldness, depth, and velocity. |
| ⚔️ Battle Mode | Compare two developers head-to-head with trait overlays and AI battle analysis. |
| 🔥 Roast Engine | Brutal but data-grounded profile roast with redemptive closing line. |
| 🕰️ Time Machine | Year-by-year narrative evolution of a developer's coding journey. |
| 🗺️ GitMap | Geospatial-style insight card connecting region, language focus, and output signal. |
| ✍️ Commit Linguistics | Psychological and style analysis from real commit message patterns. |
| 💥 Cognitive Load Analysis | Burnout-style risk scoring based on timing, activity spread, and commit behavior. |
| 📰 GitHub Newspaper | Multi-page AI-generated news edition for a developer profile. |
| 🎴 Trading Card Generator | Exportable collectible-style developer card with rarity and stats. |
| 🏆 Achievement Vault | Unlockable profile achievements and progression style milestones. |
| 🔗 Share + Deep Links | Direct links to profile states and comparison flows. |
| 🥚 Hidden Layer | ...and 9 hidden easter eggs. |

## Tech Stack

- Frontend: React, Vite, Recharts, Framer Motion
- AI Layer: Groq (Llama 3.1) + Google Gemini Flash
- Backend: FastAPI, Python, httpx
- Deployment: Vercel (frontend) + Railway (backend)
- Data: GitHub REST API + GitHub Events API

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Aanishnithin07/gitdna.git
cd gitdna
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Set up Python backend environment

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 4. Create backend environment file

```bash
cp backend/.env.example backend/.env
```

backend/.env.example

```env
GITHUB_TOKEN=your_github_token_here
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://127.0.0.1:5173
```

### 5. Create frontend environment file

```bash
cat > .env << 'EOF'
VITE_API_URL=http://127.0.0.1:8000
VITE_GITHUB_TOKEN=
EOF
```

### 6. Run backend

```bash
source .venv/bin/activate
python -m uvicorn --app-dir backend main:app --host 127.0.0.1 --port 8000
```

### 7. Run frontend (new terminal)

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

http://127.0.0.1:5173/gitdna/

## Free API Keys

- GitHub token: https://github.com/settings/tokens
- Groq: https://console.groq.com/ (free, no card)
- Gemini: https://aistudio.google.com/ (free, no card)

## Environment Variables

| Variable | Required | Where to get |
|---|---|---|
| GITHUB_TOKEN | Yes | GitHub Personal Access Token: https://github.com/settings/tokens |
| GROQ_API_KEY | Yes | Groq Console: https://console.groq.com/ |
| GEMINI_API_KEY | Yes | Google AI Studio: https://aistudio.google.com/ |
| FRONTEND_URL | Yes (prod) | Your deployed frontend URL (Vercel domain) |
| VITE_API_URL | Yes | Backend public URL (Railway URL or local http://127.0.0.1:8000) |

Optional:

- VITE_GITHUB_TOKEN for client-side GitHub fallback and higher anonymous request headroom.

## Self-Hosting on Vercel + Railway

### Deploy frontend to Vercel

[![Deploy](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Aanishnithin07/gitdna&project-name=gitdna&repository-name=gitdna)

After import:

1. Set VITE_API_URL to your Railway backend URL.
2. Deploy.

### Deploy backend to Railway

1. Create new Railway project from GitHub repository.
2. Set service root directory to backend.
3. Build command: pip install -r requirements.txt
4. Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
5. Add env vars: GITHUB_TOKEN, GROQ_API_KEY, GEMINI_API_KEY, FRONTEND_URL
6. Copy Railway public URL and place it in VITE_API_URL on Vercel.

## Contributing

GitDNA is open source. PRs welcome.

- Open issues: https://github.com/Aanishnithin07/gitdna/issues
- Fork, build, improve, ship.

## Creator

Built by @Aanishnithin07

Vision: make developer identity visible through behavior, not vanity metrics.

- GitHub: https://github.com/Aanishnithin07
- X/Twitter: https://x.com/aanishnithin07

## License

MIT License.

Free to use, fork, and build on.







