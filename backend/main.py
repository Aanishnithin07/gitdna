import os
import time
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from ai_engine import GroqAIEngine
from analyzer import GitHubAnalyzer

load_dotenv()

app = FastAPI(title="GitDNA Backend", version="1.0.0")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

allowed_origins = {
    "http://localhost:5173",
    "https://your-vercel-url.vercel.app",
}
frontend_url = os.getenv("FRONTEND_URL", "").strip()
if frontend_url:
    allowed_origins.add(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CACHE_TTL_SECONDS = 15 * 60
_cache: dict[str, dict[str, Any]] = {}

analyzer = GitHubAnalyzer(os.getenv("GITHUB_TOKEN"))
ai_engine = GroqAIEngine(os.getenv("GROQ_API_KEY"))


def _cache_key(username: str) -> str:
    return username.strip().lower()


def _cache_get(username: str) -> dict[str, Any] | None:
    key = _cache_key(username)
    entry = _cache.get(key)
    if not entry:
        return None

    now = time.time()
    if now - entry["timestamp"] > CACHE_TTL_SECONDS:
        _cache.pop(key, None)
        return None

    return entry["data"]


def _cache_set(username: str, data: dict[str, Any]) -> None:
    _cache[_cache_key(username)] = {
        "timestamp": time.time(),
        "data": data,
    }


@app.on_event("shutdown")
async def on_shutdown() -> None:
    await analyzer.close()


@app.get("/api/analyze/{username}")
@limiter.limit("10/minute")
async def analyze_profile(request: Request, username: str) -> dict[str, Any]:
    if not username.strip():
        raise HTTPException(status_code=400, detail="Username is required.")

    cached = _cache_get(username)
    if cached:
        return cached

    github_data = await analyzer.analyze_profile(username)
    ai_data = await ai_engine.generate_profile_insights(github_data)

    response = {
        "username": github_data.get("user", {}).get("login", username),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "github": github_data,
        "ai": ai_data,
    }

    _cache_set(username, response)
    return response
