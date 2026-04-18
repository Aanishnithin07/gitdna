import asyncio
import json
import os
import time
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from fastapi import Body, FastAPI, HTTPException, Request
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


class TimeMachineNarrationPayload(BaseModel):
    username: str
    yearData: list[dict[str, Any]]
    firstLanguage: str
    currentLanguage: str
    velocityMultiplier: float
    totalYearsActive: int


class GitMapInsightPayload(BaseModel):
    username: str
    city: str
    country: str
    topLang: str
    totalStars: int
    accountAge: float
    recentCommits: int = 0


class CommitLinguisticsPayload(BaseModel):
    username: str
    commitMessages: list[str]


class NewspaperPayload(BaseModel):
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


def _normalize_frontend_github_payload(username: str, body: dict[str, Any]) -> dict[str, Any]:
    safe_body = dict(body) if isinstance(body, dict) else {}
    safe_username = username.strip()

    user = safe_body.get("user") if isinstance(safe_body.get("user"), dict) else {}
    user = dict(user)
    user["login"] = str(user.get("login") or safe_body.get("username") or safe_username)

    if "followers" not in user and isinstance(safe_body.get("followers"), (int, float)):
        user["followers"] = int(safe_body["followers"])
    if "following" not in user and isinstance(safe_body.get("following"), (int, float)):
        user["following"] = int(safe_body["following"])
    if "public_repos" not in user and isinstance(safe_body.get("total_repos"), (int, float)):
        user["public_repos"] = int(safe_body["total_repos"])

    if not user.get("created_at") and isinstance(safe_body.get("created_at"), str):
        user["created_at"] = safe_body["created_at"]
    if not user.get("bio") and isinstance(safe_body.get("bio"), str):
        user["bio"] = safe_body["bio"]
    if not user.get("blog") and isinstance(safe_body.get("blog"), str):
        user["blog"] = safe_body["blog"]

    repos = safe_body.get("repos") if isinstance(safe_body.get("repos"), list) else []
    events = safe_body.get("events") if isinstance(safe_body.get("events"), list) else []

    total_stars = safe_body.get("total_stars")
    if not isinstance(total_stars, (int, float)):
        total_stars = sum(int(repo.get("stargazers_count") or 0) for repo in repos if isinstance(repo, dict))

    top_languages = safe_body.get("top_languages")
    if not isinstance(top_languages, list):
        top_languages = []

    recent_commit_messages = safe_body.get("recent_commit_messages")
    if not isinstance(recent_commit_messages, list):
        recent_commit_messages = []

    recent_commit_timestamps = safe_body.get("recent_commit_timestamps")
    if not isinstance(recent_commit_timestamps, list):
        recent_commit_timestamps = []

    if not recent_commit_messages and events:
        for event in events:
            if not isinstance(event, dict) or event.get("type") != "PushEvent":
                continue

            payload = event.get("payload") if isinstance(event.get("payload"), dict) else {}
            commits = payload.get("commits") if isinstance(payload.get("commits"), list) else []
            for commit in commits:
                if not isinstance(commit, dict):
                    continue
                message = str(commit.get("message") or "").strip()
                if not message:
                    continue
                recent_commit_messages.append(message.split("\n", 1)[0])

            created_at = str(event.get("created_at") or "").strip()
            if created_at:
                recent_commit_timestamps.append(created_at)

    weekend_vs_weekday = safe_body.get("weekend_vs_weekday") if isinstance(safe_body.get("weekend_vs_weekday"), dict) else {}
    if not weekend_vs_weekday:
        weekend_ratio = safe_body.get("weekend_ratio") if isinstance(safe_body.get("weekend_ratio"), (int, float)) else 0.0
        weekend_vs_weekday = {
            "weekend_commits": 0,
            "weekday_commits": 0,
            "ratio": float(weekend_ratio),
        }

    normalized = {
        **safe_body,
        "username": user["login"],
        "user": user,
        "repos": repos,
        "events": events,
        "total_stars": int(total_stars),
        "top_languages": top_languages,
        "recent_commit_messages": [str(message).strip() for message in recent_commit_messages if str(message).strip()],
        "recent_commit_timestamps": [str(ts).strip() for ts in recent_commit_timestamps if str(ts).strip()],
        "weekend_vs_weekday": weekend_vs_weekday,
    }

    if "recent_commits_30d" not in normalized:
        normalized["recent_commits_30d"] = len(normalized["recent_commit_messages"])

    return normalized


async def full_analysis_from_payload(username: str, body: dict[str, Any]) -> dict[str, Any]:
    cached = _cache_get(username)
    if cached:
        return cached

    github_data = _normalize_frontend_github_payload(username, body)
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


@app.post("/api/analyze/{username}")
@limiter.limit("10/minute")
async def analyze_profile_from_frontend(request: Request, username: str, body: dict[str, Any] = Body(...)):
    if not username.strip():
        raise HTTPException(status_code=400, detail="Username is required.")

    wants_stream = "text/event-stream" in request.headers.get("accept", "").lower()
    if not wants_stream:
        return await full_analysis_from_payload(username, body)

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
            await asyncio.sleep(0.2)

        yield f"data: {json.dumps({'step': 8, 'message': 'FINALIZING PROFILE'})}\n\n"
        await asyncio.sleep(0.1)

        result = await full_analysis_from_payload(username, body)
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


@app.post("/api/time-machine-narration")
@limiter.limit("10/minute")
async def time_machine_narration(request: Request, payload: TimeMachineNarrationPayload) -> dict[str, Any]:
    if not payload.yearData:
        raise HTTPException(status_code=400, detail="yearData is required.")

    try:
        narration = await ai_engine.generate_time_machine_narration(payload.model_dump())
    except Exception as exc:  # pragma: no cover - defensive API boundary
        raise HTTPException(status_code=502, detail="Time Machine narration generation failed.") from exc

    return {"narration": narration}


@app.post("/api/gitmap-insight")
@limiter.limit("20/minute")
async def gitmap_insight(request: Request, payload: GitMapInsightPayload) -> dict[str, str]:
    try:
        insight = await ai_engine.generate_gitmap_insight(payload.model_dump())
    except Exception as exc:  # pragma: no cover - defensive API boundary
        raise HTTPException(status_code=502, detail="GitMap insight generation failed.") from exc

    return {"insight": insight}


@app.post("/api/commit-linguistics-insight")
@limiter.limit("25/minute")
async def commit_linguistics_insight(request: Request, payload: CommitLinguisticsPayload) -> dict[str, str]:
    try:
        insight = await ai_engine.generate_commit_linguistics_insight(payload.model_dump())
    except Exception as exc:  # pragma: no cover - defensive API boundary
        raise HTTPException(status_code=502, detail="Commit linguistics insight generation failed.") from exc

    return {"insight": insight}


@app.post("/api/newspaper")
@limiter.limit("10/minute")
async def generate_newspaper(request: Request, payload: NewspaperPayload) -> dict[str, Any]:
    if not payload.profile:
        raise HTTPException(status_code=400, detail="Profile payload is required for newspaper generation.")

    try:
        newspaper = await ai_engine.generate_newspaper_front_page(payload.profile)
    except Exception as exc:  # pragma: no cover - defensive API boundary
        raise HTTPException(status_code=502, detail="GitHub newspaper generation failed.") from exc

    return {"newspaper": newspaper}
