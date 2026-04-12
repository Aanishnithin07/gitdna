import hashlib
import json
import os
import re
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from groq import AsyncGroq

load_dotenv()

client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

MODEL_NAME = "llama-3.1-8b-instant"
SYSTEM_PROMPT = (
    "You are a behavioral data scientist specializing in developer psychology. "
    "You analyze GitHub contribution patterns the way a forensic psychologist reads behavior. "
    "Be specific, witty, and grounded in the actual numbers provided. "
    "NEVER be generic. Every sentence must reference their real stats. "
    "You MUST respond with ONLY a valid JSON object — no explanation, no markdown, no backticks."
)


def _clamp_int(value: float, low: int = 0, high: int = 100) -> int:
    return int(max(low, min(high, round(value))))


def _to_float(value: Any, default: float | None = None) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _to_int(value: Any, default: int = 0) -> int:
    casted = _to_float(value)
    if casted is None:
        return default
    return int(casted)


def _parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None


def _account_age_years(created_at: str | None) -> float:
    created = _parse_iso_datetime(created_at)
    if created is None:
        return 0.0
    delta = datetime.now(timezone.utc) - created
    return round(delta.total_seconds() / (60 * 60 * 24 * 365.25), 2)


def _hour_bucket(avg_hour: float | None) -> str:
    if avg_hour is None:
        return "unknown"
    hour = int(avg_hour) % 24
    if 0 <= hour <= 5:
        return "midnight"
    if 6 <= hour <= 11:
        return "morning"
    if 12 <= hour <= 17:
        return "afternoon"
    return "night"


def _chronotype_title(avg_hour: float | None) -> str:
    if avg_hour is None:
        return "Dayshift Operator"
    hour = int(avg_hour) % 24
    if 0 <= hour <= 5:
        return "Midnight Architect"
    if 6 <= hour <= 11:
        return "Dawn Protocol Engineer"
    if 12 <= hour <= 17:
        return "Dayshift Operator"
    return "Evening Systems Engineer"


def _chronotype_work_style(title: str) -> str:
    mapping = {
        "Midnight Architect": "Deep Night Sprinter",
        "Dawn Protocol Engineer": "Early Signal Operator",
        "Dayshift Operator": "Structured Day Driver",
        "Evening Systems Engineer": "Sunset Momentum Builder",
    }
    return mapping.get(title, "Adaptive Rhythm Coder")


def _tier_from_stars(stars: int) -> str:
    if stars <= 10:
        return "RISING"
    if stars <= 100:
        return "VETERAN"
    if stars <= 1000:
        return "ELITE"
    return "LEGENDARY"


def _extract_top_languages(github_data: dict[str, Any]) -> list[dict[str, Any]]:
    top_languages: list[dict[str, Any]] = []
    for item in (github_data.get("top_languages") or [])[:3]:
        if not isinstance(item, dict):
            continue
        language = str(item.get("language") or item.get("lang") or "Unknown")
        percentage = _to_float(item.get("percentage"), None)
        if percentage is None:
            percentage = _to_float(item.get("pct"), 0.0) or 0.0
        top_languages.append({"language": language, "percentage": round(percentage, 2)})

    if not top_languages:
        top_languages.append({"language": "Unknown", "percentage": 0.0})
    return top_languages


def _estimate_recent_commits_30d(github_data: dict[str, Any]) -> int:
    for key in ("recent_commits_30d", "recent_commits_last_30_days", "total_recent_commits_30d"):
        value = github_data.get(key)
        if isinstance(value, (int, float)):
            return max(0, int(value))

    now = datetime.now(timezone.utc)
    thirty_days_seconds = 30 * 24 * 60 * 60
    timestamps = github_data.get("recent_commit_timestamps") or github_data.get("commit_timestamps") or []
    if isinstance(timestamps, list) and timestamps:
        count = 0
        for ts in timestamps:
            dt = _parse_iso_datetime(ts if isinstance(ts, str) else None)
            if dt and (now - dt).total_seconds() <= thirty_days_seconds:
                count += 1
        if count > 0:
            return count

    return len(github_data.get("recent_commit_messages") or [])


def _extract_metrics(github_data: dict[str, Any]) -> dict[str, Any]:
    user = github_data.get("user") or {}
    username = str(user.get("login") or github_data.get("username") or "unknown")
    total_stars = _to_int(github_data.get("total_stars"), 0)
    followers = _to_int(user.get("followers"), 0)
    public_repos = _to_int(user.get("public_repos"), 0)
    account_age_years = _account_age_years(user.get("created_at"))
    top_languages = _extract_top_languages(github_data)

    avg_commit_hour = _to_float(github_data.get("avg_commit_hour"), None)
    if avg_commit_hour is not None:
        avg_commit_hour = max(0.0, min(23.99, avg_commit_hour))

    weekend_data = github_data.get("weekend_vs_weekday") or {}
    weekend_commits = _to_int(weekend_data.get("weekend_commits"), 0)
    weekday_commits = _to_int(weekend_data.get("weekday_commits"), 0)
    ratio = _to_float(weekend_data.get("ratio"), None)
    if ratio is None and weekday_commits > 0:
        ratio = weekend_commits / weekday_commits
    if ratio is not None:
        ratio = round(ratio, 3)

    commit_messages = [
        str(message).strip()
        for message in (github_data.get("recent_commit_messages") or [])
        if str(message).strip()
    ]

    return {
        "username": username,
        "account_age_years": account_age_years,
        "total_stars": total_stars,
        "followers": followers,
        "public_repos": public_repos,
        "top_languages": top_languages,
        "avg_commit_hour": avg_commit_hour,
        "hour_bucket": _hour_bucket(avg_commit_hour),
        "weekend_commits": weekend_commits,
        "weekday_commits": weekday_commits,
        "weekend_weekday_ratio": ratio,
        "last_commit_messages": commit_messages[:10],
        "recent_commits_30d": _estimate_recent_commits_30d(github_data),
    }


def _fallback_analysis(github_data: dict[str, Any]) -> dict[str, Any]:
    metrics = _extract_metrics(github_data)
    username = metrics["username"]
    stars = metrics["total_stars"]
    repos = metrics["public_repos"]
    followers = metrics["followers"]
    age_years = metrics["account_age_years"]
    avg_hour = metrics["avg_commit_hour"]
    ratio = metrics["weekend_weekday_ratio"]
    ratio_for_calc = ratio if ratio is not None else 0.35
    commits_30d = metrics["recent_commits_30d"]
    weekend_commits = metrics["weekend_commits"]
    weekday_commits = metrics["weekday_commits"]

    stars_per_repo = stars / max(repos, 1)
    followers_per_repo = followers / max(repos, 1)
    activity_factor = min(commits_30d, 120) / 120

    creativity = _clamp_int(32 + stars_per_repo * 9 + min(repos, 100) * 0.25)
    discipline = _clamp_int(30 + activity_factor * 45 + (8 if weekday_commits >= weekend_commits else 2))
    collaboration = _clamp_int(26 + min(followers, 1200) / 20 + followers_per_repo * 12)
    boldness = _clamp_int(28 + min(stars, 2000) / 30 + min(repos, 120) * 0.18)
    depth = _clamp_int(34 + stars_per_repo * 10 + min(age_years, 15) * 2.2)
    velocity = _clamp_int(25 + activity_factor * 55 + min(repos, 100) * 0.15)

    top_lang = metrics["top_languages"][0]
    avg_hour_display = int(avg_hour) if avg_hour is not None else 12
    chronotype_title = _chronotype_title(avg_hour)
    work_style = _chronotype_work_style(chronotype_title)
    tier = _tier_from_stars(stars)
    dna_sequence = hashlib.md5(username.lower().encode("utf-8")).hexdigest()[:16].upper()

    return {
        "devClass": "The Silent Builder",
        "archetype": {
            "name": "Signal Weighted Architect",
            "tier": tier,
            "description": (
                f"{username} has {stars} stars, {repos} public repos, and {followers} followers, which signals tangible public impact. "
                f"With {commits_30d} recent commits in 30 days, this profile shows a steady build cadence rather than random bursts."
            ),
        },
        "chronotype": {
            "title": chronotype_title,
            "description": (
                f"Average commits land at {avg_hour_display}:00 UTC, placing this profile in {metrics['hour_bucket']} operating mode. "
                f"Weekend to weekday ratio is {ratio_for_calc:.3f}, showing how {username} distributes output across the week."
            ),
            "workStyle": work_style,
        },
        "collaborationStyle": {
            "title": "Asynchronous Builder",
            "description": (
                f"{repos} repos and {followers} followers suggest collaboration mostly through shipped artifacts and visible code outcomes. "
                f"The weekend/weekday split ({weekend_commits}/{weekday_commits}) indicates how this builder balances solo execution with sustained public delivery."
            ),
            "score": collaboration,
        },
        "traits": {
            "creativity": creativity,
            "discipline": discipline,
            "collaboration": collaboration,
            "boldness": boldness,
            "depth": depth,
            "velocity": velocity,
        },
        "fastFacts": [
            f"{username} has {stars} stars across {repos} public repos, so the output signal is measurable and public.",
            f"Average commit time is {avg_hour_display}:00 UTC, which puts this profile in {metrics['hour_bucket']} mode.",
            f"Top language is {top_lang['language']} at {top_lang['percentage']}%, and account age is {age_years:.2f} years.",
        ],
        "dnaSequence": dna_sequence,
        "strengthReport": (
            f"{username} excels at converting steady commit activity ({commits_30d} in 30 days) into visible public code output across {repos} repositories."
        ),
        "warningSign": (
            f"With a weekend/weekday ratio of {ratio_for_calc:.3f}, pacing can drift unless deliberate recovery windows are protected during high-output cycles."
        ),
    }


def _safe_json_parse(content: str) -> dict[str, Any] | None:
    cleaned = (content or "").replace("```json", "").replace("```", "").strip()
    if not cleaned:
        return None

    try:
        data = json.loads(cleaned)
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return None
        try:
            data = json.loads(cleaned[start : end + 1])
            return data if isinstance(data, dict) else None
        except json.JSONDecodeError:
            return None


def _valid_dna(value: str) -> bool:
    return bool(re.fullmatch(r"[0-9A-F]{16}", value or ""))


def _normalize_result(parsed: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    result = json.loads(json.dumps(fallback))
    if not isinstance(parsed, dict):
        return result

    for key in ("devClass", "strengthReport", "warningSign"):
        value = parsed.get(key)
        if isinstance(value, str) and value.strip():
            result[key] = value.strip()

    dna_sequence = parsed.get("dnaSequence")
    if isinstance(dna_sequence, str) and _valid_dna(dna_sequence.strip().upper()):
        result["dnaSequence"] = dna_sequence.strip().upper()

    parsed_archetype = parsed.get("archetype")
    if isinstance(parsed_archetype, dict):
        for key in ("name", "description"):
            value = parsed_archetype.get(key)
            if isinstance(value, str) and value.strip():
                result["archetype"][key] = value.strip()
        tier = parsed_archetype.get("tier")
        if isinstance(tier, str) and tier.strip().upper() in {"LEGENDARY", "ELITE", "VETERAN", "RISING"}:
            result["archetype"]["tier"] = tier.strip().upper()

    parsed_chronotype = parsed.get("chronotype")
    if isinstance(parsed_chronotype, dict):
        for key in ("title", "description", "workStyle"):
            value = parsed_chronotype.get(key)
            if isinstance(value, str) and value.strip():
                result["chronotype"][key] = value.strip()

    parsed_collab = parsed.get("collaborationStyle")
    if isinstance(parsed_collab, dict):
        for key in ("title", "description"):
            value = parsed_collab.get(key)
            if isinstance(value, str) and value.strip():
                result["collaborationStyle"][key] = value.strip()
        score = _to_float(parsed_collab.get("score"), None)
        if score is not None:
            result["collaborationStyle"]["score"] = _clamp_int(score)

    parsed_traits = parsed.get("traits")
    if isinstance(parsed_traits, dict):
        for trait in ("creativity", "discipline", "collaboration", "boldness", "depth", "velocity"):
            score = _to_float(parsed_traits.get(trait), None)
            if score is not None:
                result["traits"][trait] = _clamp_int(score)

    fast_facts = parsed.get("fastFacts")
    if isinstance(fast_facts, list):
        clean = [str(item).strip() for item in fast_facts if isinstance(item, str) and item.strip()]
        if clean:
            merged = (clean + result["fastFacts"])[:3]
            result["fastFacts"] = merged

    return result


def _build_user_prompt(metrics: dict[str, Any]) -> str:
    top_langs = ", ".join(
        f"{item['language']} ({item['percentage']}%)" for item in metrics["top_languages"][:3]
    )
    last_messages = "\n".join(metrics["last_commit_messages"]) or "No commit messages available"
    ratio_display = (
        f"{metrics['weekend_weekday_ratio']} (weekend={metrics['weekend_commits']}, weekday={metrics['weekday_commits']})"
        if metrics["weekend_weekday_ratio"] is not None
        else f"unavailable (weekend={metrics['weekend_commits']}, weekday={metrics['weekday_commits']})"
    )
    avg_hour_display = (
        f"{metrics['avg_commit_hour']:.2f} UTC ({metrics['hour_bucket']})"
        if metrics["avg_commit_hour"] is not None
        else "unknown"
    )

    return f"""Analyze this GitHub behavioral dataset and return ONLY JSON.

username: {metrics['username']}
account_age_years: {metrics['account_age_years']}
total_stars: {metrics['total_stars']}
followers: {metrics['followers']}
public_repos: {metrics['public_repos']}
top_3_languages_with_percentages: {top_langs}
average_commit_hour_utc: {avg_hour_display}
weekend_vs_weekday_commit_ratio: {ratio_display}
total_recent_commits_last_30_days: {metrics['recent_commits_30d']}
last_10_commit_messages_raw:
{last_messages}

Respond with this exact JSON schema and no extra keys:
{{
  "devClass": "creative RPG-style archetype, 3-5 words",
  "archetype": {{
    "name": "archetype name",
    "tier": "LEGENDARY or ELITE or VETERAN or RISING",
    "description": "2 sentences, specific to their numbers"
  }},
  "chronotype": {{
    "title": "creative name based on their commit hour pattern",
    "description": "2 sentences linking their timing to personality",
    "workStyle": "one phrase: e.g. Deep Night Sprinter"
  }},
  "collaborationStyle": {{
    "title": "archetype name",
    "description": "2 sentences based on repo patterns and commit behavior",
    "score": 0
  }},
  "traits": {{
    "creativity": 0,
    "discipline": 0,
    "collaboration": 0,
    "boldness": 0,
    "depth": 0,
    "velocity": 0
  }},
  "fastFacts": [
    "punchy fact using their real star count or repo count",
    "fact about their commit timing with their actual hour",
    "fact about their top language or account age"
  ],
  "dnaSequence": "exactly 16 uppercase hex characters",
  "strengthReport": "1 sentence about what they genuinely excel at",
  "warningSign": "1 sentence about their blindspot based on the data"
}}"""


async def analyze_developer(github_data: dict) -> dict:
    """Run Groq behavioral analysis, always returning a valid structured profile."""
    fallback = _fallback_analysis(github_data)
    api_key = (os.getenv("GROQ_API_KEY") or "").strip()
    if not api_key:
        return fallback

    try:
        metrics = _extract_metrics(github_data)
        response = await client.chat.completions.create(
            model=MODEL_NAME,
            temperature=0.55,
            max_tokens=1200,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(metrics)},
            ],
        )

        raw_content = ""
        if response.choices:
            content = response.choices[0].message.content
            if isinstance(content, list):
                raw_content = "".join(part.get("text", "") for part in content if isinstance(part, dict))
            else:
                raw_content = str(content or "")

        parsed = _safe_json_parse(raw_content)
        if parsed is None:
            return fallback
        return _normalize_result(parsed, fallback)
    except Exception:
        return fallback


class GroqAIEngine:
    """Compatibility wrapper used by the FastAPI app."""

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        if api_key:
            os.environ["GROQ_API_KEY"] = api_key
        self.model = model or MODEL_NAME

    async def generate_profile_insights(self, github_data: dict[str, Any]) -> dict[str, Any]:
        return await analyze_developer(github_data)
