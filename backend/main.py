import asyncio
import json
import os
import time
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
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
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
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


class BattlePayload(BaseModel):
    left: dict[str, Any]
    right: dict[str, Any]


class RoastPayload(BaseModel):
    profile: dict[str, Any]


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


async def full_analysis(username: str) -> dict[str, Any]:
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


@app.on_event("shutdown")
async def on_shutdown() -> None:
    await analyzer.close()


@app.get("/api/analyze/{username}")
@limiter.limit("10/minute")
async def analyze_profile(request: Request, username: str):
    if not username.strip():
        raise HTTPException(status_code=400, detail="Username is required.")

    wants_stream = "text/event-stream" in request.headers.get("accept", "").lower()
    if not wants_stream:
        return await full_analysis(username)

    async def generate():
        steps = [
            "CONNECTING TO GITHUB",
            "EXTRACTING REPOSITORY GENOME",
            "MAPPING LANGUAGE TOPOLOGY",
            "ANALYZING COMMIT BEHAVIOR",
            "DECODING COLLABORATION PATTERNS",
            "RUNNING BEHAVIORAL ENGINE",
            "SYNTHESIZING PROFILE",
            "RENDERING PSYCHOLOGICAL MATRIX",
        ]

        for i, message in enumerate(steps):
            yield f"data: {json.dumps({'step': i, 'message': message})}\n\n"
            await asyncio.sleep(0.3)

        yield f"data: {json.dumps({'step': 8, 'message': 'FINALIZING PROFILE'})}\n\n"
        await asyncio.sleep(0.2)

        result = await full_analysis(username)
        yield f"data: {json.dumps({'step': 9, 'message': 'PROFILE READY — INITIALIZING', 'done': True, 'data': result})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/battle")
@limiter.limit("10/minute")
async def battle_analysis(request: Request, payload: BattlePayload) -> dict[str, str]:
    if not payload.left or not payload.right:
        raise HTTPException(status_code=400, detail="Both profiles are required for battle analysis.")

    analysis = await ai_engine.generate_battle_analysis(payload.left, payload.right)
    return {"analysis": analysis}


@app.post("/api/roast")
@limiter.limit("10/minute")
async def roast_profile(request: Request, payload: RoastPayload) -> dict[str, Any]:
    if not payload.profile:
        raise HTTPException(status_code=400, detail="Profile payload is required for roasting.")

    return await ai_engine.generate_roast_report(payload.profile)
