import asyncio
import hashlib
import json
import math
import os
import re
from collections import Counter
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from groq import AsyncGroq

load_dotenv()

groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

GROQ_FAST_MODEL_NAME = (os.getenv("GROQ_FAST_MODEL") or "llama-3.1-8b-instant").strip() or "llama-3.1-8b-instant"
GROQ_STRUCTURED_MODEL_ENV = (os.getenv("GROQ_STRUCTURED_MODEL") or "").strip()
GROQ_STRUCTURED_MODEL_CANDIDATES = [
    model
    for model in (
        GROQ_STRUCTURED_MODEL_ENV,
        "llama-3.3-70b-versatile",
        "llama-3.1-70b-versatile",
        GROQ_FAST_MODEL_NAME,
    )
    if model
]
GROQ_FAST_TIMEOUT_SECONDS = 6.0
GROQ_STRUCTURED_TIMEOUT_SECONDS = 12.0


def _dedupe_models(models: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for model in models:
        if model in seen:
            continue
        seen.add(model)
        ordered.append(model)
    return ordered


GROQ_STRUCTURED_MODEL_CANDIDATES = _dedupe_models(GROQ_STRUCTURED_MODEL_CANDIDATES)


def _has_groq_key() -> bool:
    return bool((os.getenv("GROQ_API_KEY") or "").strip())


async def _with_timeout(coro, timeout_seconds: float, fallback: str = "") -> str:
    try:
        return await asyncio.wait_for(coro, timeout=timeout_seconds)
    except Exception:
        return fallback


async def call_groq(
    prompt: str,
    system: str,
    max_tokens: int = 800,
    temperature: float = 0.6,
    fallback: str = "",
    model_candidates: list[str] | None = None,
    timeout_seconds: float | None = None,
) -> str:
    if not _has_groq_key():
        return str(fallback or "").strip()

    models = _dedupe_models(model_candidates or [GROQ_FAST_MODEL_NAME])
    timeout = timeout_seconds if isinstance(timeout_seconds, (int, float)) and timeout_seconds > 0 else GROQ_FAST_TIMEOUT_SECONDS

    for model_name in models:
        async def _request(selected_model: str = model_name) -> str:
            response = await groq_client.chat.completions.create(
                model=selected_model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
            )

            content = response.choices[0].message.content if response.choices else ""
            if isinstance(content, list):
                return "".join(part.get("text", "") for part in content if isinstance(part, dict)).strip()
            return str(content or "").strip()

        result = await _with_timeout(_request(), timeout, fallback="")
        cleaned = str(result or "").strip()
        if cleaned:
            return cleaned

    return str(fallback or "").strip()


SYSTEM_PROMPT = (
    "You are a behavioral data scientist specializing in developer psychology. "
    "You analyze GitHub contribution patterns the way a forensic psychologist reads behavior. "
    "Be specific, witty, and grounded in the actual numbers provided. "
    "NEVER be generic. Every sentence must reference their real stats. "
    "You MUST respond with ONLY a valid JSON object — no explanation, no markdown, no backticks."
)

BATTLE_SYSTEM_PROMPT = (
    "You are a brutally honest staff engineer judging two developer profiles. "
    "Answer as direct battle analysis text with no markdown. "
    "Be opinionated but grounded in the provided numbers."
)

ROAST_SYSTEM_PROMPT = (
    "You are a brutally honest, darkly funny tech comedian roasting "
    "a developer's GitHub profile. You are mean but not cruel — "
    "like a comedy roast at a dev conference. "
    "Reference their ACTUAL numbers. "
    "Mock their commit messages if they're lazy ('fix stuff', 'wip', 'asdfgh'). "
    "Mock their repo count if too low or too high. "
    "Mock their language choices with stereotypes "
    "(PHP developers, jQuery users, etc). "
    "Mock their commit timing if they code at 3am. "
    "Be specific, be funny, be relentless. "
    "End with ONE genuine compliment — the redemption. "
    "Return ONLY a JSON: "
    "{ "
    "'roastLines': [string, string, string, string, string], "
    "'redemption': string, "
    "'roastScore': integer 0-100 (how roastable they are) "
    "}"
)

TIME_MACHINE_SYSTEM_PROMPT = (
    "You are the narrator of a developer's career story. "
    "Write like a legendary game narrator — cinematic, punchy, occasionally dramatic. "
    "One sentence per year. Ground every sentence in the actual numbers. "
    "Never be generic. Return ONLY valid JSON."
)

GITMAP_INSIGHT_SYSTEM_PROMPT = (
    "You are a concise global developer intelligence analyst. "
    "Write exactly one sentence in plain text. "
    "Include concrete metrics from the payload and avoid generic language."
)

COMMIT_LINGUISTICS_SYSTEM_PROMPT = (
    "You analyze developer commit messages for psychological and behavioral patterns. "
    "Be specific, brief, and occasionally darkly witty. "
    "2-3 sentences maximum. Reference the actual messages."
)

NEWSPAPER_SYSTEM_PROMPT = (
    "You are the editor-in-chief of a dramatic but factual developer newspaper front page. "
    "Write with newsroom energy, grounded in the profile metrics provided. "
    "Do not use markdown. Do not invent impossible values. "
    "Return ONLY valid JSON with the exact keys requested."
)

HARDCODED_LAZY_COMMIT_LINE = (
    "Your commit messages read like someone typing with their elbows. "
    "'fix', 'wip', 'update'? Git blame will find you."
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

    peak_commit_hour = _to_int(github_data.get("peak_commit_hour"), -1)
    if peak_commit_hour < 0 or peak_commit_hour > 23:
        peak_commit_hour = None

    night_commit_ratio = _to_float(github_data.get("night_commit_ratio"), None)
    if night_commit_ratio is None:
        if avg_commit_hour is not None and (avg_commit_hour < 6 or avg_commit_hour >= 22):
            night_commit_ratio = 0.55
        else:
            night_commit_ratio = 0.0

    business_hour_commit_ratio = _to_float(github_data.get("business_hour_commit_ratio"), 0.0) or 0.0

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

    all_tokens: list[str] = []
    for message in commit_messages:
        all_tokens.extend(re.findall(r"[a-zA-Z]{2,}", message.lower()))

    stopwords = {
        "the", "and", "for", "from", "with", "into", "this", "that", "merge", "branch",
        "main", "dev", "feat", "fix", "wip", "update", "test", "add", "remove", "changes",
        "code", "issue", "pull", "request", "release", "bump", "version", "refactor", "bug",
    }
    filtered_tokens = [token for token in all_tokens if token not in stopwords and len(token) > 2]
    top_terms = [term for term, _ in Counter(filtered_tokens).most_common(6)]

    lexical_diversity = 0.0
    if all_tokens:
        lexical_diversity = round(len(set(all_tokens)) / len(all_tokens), 3)

    lazy_commit_ratio = round(_lazy_commit_ratio(commit_messages), 3)

    language_diversity = _to_int(github_data.get("language_diversity"), 0)
    if language_diversity <= 0:
        language_diversity = len({item.get("language") for item in top_languages if item.get("language")})

    active_repos_30d = _to_int(github_data.get("active_repos_30d"), 0)
    active_repos_90d = _to_int(github_data.get("active_repos_90d"), 0)
    stale_repos_180d = _to_int(github_data.get("stale_repos_180d"), 0)
    archived_repo_count = _to_int(github_data.get("archived_repo_count"), 0)
    fork_repo_count = _to_int(github_data.get("fork_repo_count"), 0)
    total_repo_size_kb = _to_int(github_data.get("total_repo_size_kb"), 0)
    avg_repo_size_kb = _to_float(github_data.get("avg_repo_size_kb"), 0.0) or 0.0
    total_open_issues = _to_int(github_data.get("total_open_issues"), 0)

    top_starred_repo = github_data.get("top_starred_repo") if isinstance(github_data.get("top_starred_repo"), dict) else {}
    largest_repo = github_data.get("largest_repo") if isinstance(github_data.get("largest_repo"), dict) else {}

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
        "commit_message_lazy_ratio": lazy_commit_ratio,
        "commit_message_lexical_diversity": lexical_diversity,
        "commit_message_top_terms": top_terms,
        "recent_commits_30d": _estimate_recent_commits_30d(github_data),
        "night_commit_ratio": round(max(0.0, min(1.0, night_commit_ratio)), 3),
        "business_hour_commit_ratio": round(max(0.0, min(1.0, business_hour_commit_ratio)), 3),
        "peak_commit_hour": peak_commit_hour,
        "language_diversity": language_diversity,
        "active_repos_30d": active_repos_30d,
        "active_repos_90d": active_repos_90d,
        "stale_repos_180d": stale_repos_180d,
        "archived_repo_count": archived_repo_count,
        "fork_repo_count": fork_repo_count,
        "total_repo_size_kb": total_repo_size_kb,
        "avg_repo_size_kb": round(avg_repo_size_kb, 2),
        "total_open_issues": total_open_issues,
        "top_starred_repo_name": str(top_starred_repo.get("name") or "") if top_starred_repo else "",
        "top_starred_repo_stars": _to_int(top_starred_repo.get("stars"), 0) if top_starred_repo else 0,
        "largest_repo_name": str(largest_repo.get("name") or "") if largest_repo else "",
        "largest_repo_size_kb": _to_int(largest_repo.get("size_kb"), 0) if largest_repo else 0,
    }


def _extract_github_section(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        return {}
    github = payload.get("github")
    if isinstance(github, dict):
        return github
    return payload


def _extract_commit_messages(profile_payload: dict[str, Any]) -> list[str]:
    github = _extract_github_section(profile_payload)
    raw_messages = github.get("recent_commit_messages") or []
    if not isinstance(raw_messages, list):
        return []
    return [str(message).strip() for message in raw_messages if str(message).strip()]


def _lazy_commit_ratio(messages: list[str]) -> float:
    if not messages:
        return 0.0

    lazy_keywords = ("fix", "wip", "update", "test", "asdf")
    lazy_count = 0
    for message in messages:
        lowered = message.lower()
        if any(re.search(rf"\b{keyword}\b", lowered) for keyword in lazy_keywords):
            lazy_count += 1
    return lazy_count / max(1, len(messages))


def _add_lazy_commit_line_if_needed(roast_lines: list[str], lazy_ratio: float) -> list[str]:
    if lazy_ratio <= 0.3:
        return roast_lines

    if any(HARDCODED_LAZY_COMMIT_LINE.lower() in line.lower() for line in roast_lines):
        return roast_lines

    return [*roast_lines, HARDCODED_LAZY_COMMIT_LINE]


def _trait(payload: dict[str, Any], key: str, default: float = 50.0) -> float:
    if not isinstance(payload, dict):
        return default

    ai_section = payload.get("ai")
    if not isinstance(ai_section, dict):
        ai_section = payload.get("aiData")
    if not isinstance(ai_section, dict):
        return default

    traits = ai_section.get("traits")
    if not isinstance(traits, dict):
        return default

    value = _to_float(traits.get(key), None)
    return value if value is not None else default


def _battle_fallback(left_payload: dict[str, Any], right_payload: dict[str, Any]) -> str:
    left_github = _extract_github_section(left_payload)
    right_github = _extract_github_section(right_payload)
    left = _extract_metrics(left_github)
    right = _extract_metrics(right_github)

    left_name = left["username"]
    right_name = right["username"]

    left_review = _trait(left_payload, "discipline") + _trait(left_payload, "depth") + _trait(left_payload, "collaboration")
    right_review = _trait(right_payload, "discipline") + _trait(right_payload, "depth") + _trait(right_payload, "collaboration")

    left_speed = _trait(left_payload, "velocity") + min(left["recent_commits_30d"], 60)
    right_speed = _trait(right_payload, "velocity") + min(right["recent_commits_30d"], 60)

    left_maint = _trait(left_payload, "discipline") + _trait(left_payload, "depth") + min(left["total_stars"] / 20, 35)
    right_maint = _trait(right_payload, "discipline") + _trait(right_payload, "depth") + min(right["total_stars"] / 20, 35)

    review_winner = left_name if left_review >= right_review else right_name
    speed_winner = left_name if left_speed >= right_speed else right_name
    maintain_winner = left_name if left_maint >= right_maint else right_name

    return (
        f"Code review winner: {review_winner}, because the review-stack score is higher "
        f"({left_name}: {left_review:.1f}, {right_name}: {right_review:.1f}). "
        f"Shipping speed winner: {speed_winner}, driven by velocity plus recent commit pressure "
        f"({left_name}: {left_speed:.1f}, {right_name}: {right_speed:.1f}). "
        f"Maintainability winner: {maintain_winner}, based on discipline-depth balance and public trust signal "
        f"({left_name}: {left_maint:.1f}, {right_name}: {right_maint:.1f})."
    )


def _extract_roast_metrics(profile_payload: dict[str, Any]) -> dict[str, Any]:
    github_data = _extract_github_section(profile_payload)
    metrics = _extract_metrics(github_data)
    commit_messages = _extract_commit_messages(profile_payload)
    lazy_ratio = _lazy_commit_ratio(commit_messages)

    ai_section = profile_payload.get("ai")
    if not isinstance(ai_section, dict):
        ai_section = profile_payload.get("aiData")
    ai_section = ai_section if isinstance(ai_section, dict) else {}

    return {
        **metrics,
        "dev_class": str(ai_section.get("devClass") or "Unknown archetype"),
        "commit_messages": commit_messages,
        "lazy_ratio": lazy_ratio,
    }


def _language_stereotype_line(language: str) -> str:
    lang = (language or "Unknown").lower()
    if "php" in lang:
        return "PHP in 2026? Bold. That's not technical debt, that's archaeological preservation."
    if "javascript" in lang:
        return "JavaScript everywhere. You don't write code, you negotiate with runtime mood swings."
    if "typescript" in lang:
        return "TypeScript says safety first, yet your TODOs suggest chaos-first development."
    if "python" in lang:
        return "Python as top language means you value clarity, then immediately wrote one-liners no human can debug."
    if "java" in lang:
        return "Java on top: enterprise discipline outside, panic stack traces inside."
    if "c++" in lang:
        return "C++ main language means your bugs don't crash immediately, they just wait for dramatic timing."
    if "rust" in lang:
        return "Rust main language. Borrow checker approved your code, your deadlines did not."
    return f"{language} leading your stack is a personality reveal and a cry for linting at the same time."


def _fallback_roast(profile_payload: dict[str, Any]) -> dict[str, Any]:
    metrics = _extract_roast_metrics(profile_payload)
    username = metrics["username"]
    stars = metrics["total_stars"]
    repos = metrics["public_repos"]
    followers = metrics["followers"]
    avg_hour = metrics["avg_commit_hour"]
    commits_30d = metrics["recent_commits_30d"]
    lazy_ratio = metrics["lazy_ratio"]
    top_lang = metrics["top_languages"][0]["language"] if metrics["top_languages"] else "Unknown"

    if repos <= 5:
        repo_line = f"{repos} repos? That's not a portfolio, that's a teaser trailer with no release date, @{username}."
    elif repos >= 120:
        repo_line = f"{repos} repos is impressive, but it also looks like you forked productivity instead of finishing features."
    else:
        repo_line = f"{repos} repos means you're committed, but your README completion rate is still classified information."

    stars_line = (
        f"{stars} total stars and {followers} followers: enough validation to be confident, not enough to escape PR review comments."
    )

    if avg_hour is None:
        timing_line = "Your commit timing is so mysterious even your circadian rhythm filed a support ticket."
    elif avg_hour < 6 or avg_hour >= 22:
        timing_line = f"Average commit hour around {avg_hour:.2f} UTC? You ship at vampire o'clock and call it 'deep work'."
    else:
        timing_line = f"Average commit hour around {avg_hour:.2f} UTC says you code in daylight, but the bugs still show up after midnight."

    commit_quality_line = (
        f"{commits_30d} recent commits sounds productive, but the message quality ratio is doing interpretive dance at {lazy_ratio:.0%}."
    )

    roast_lines = [
        repo_line,
        stars_line,
        _language_stereotype_line(top_lang),
        timing_line,
        commit_quality_line,
    ]
    roast_lines = _add_lazy_commit_line_if_needed(roast_lines, lazy_ratio)

    roast_score = _clamp_int(
        22
        + lazy_ratio * 58
        + (12 if repos <= 5 else 0)
        + (9 if repos >= 120 else 0)
        + (10 if avg_hour is not None and (avg_hour < 6 or avg_hour >= 22) else 0)
        + (8 if stars <= 10 else 0),
        0,
        100,
    )

    return {
        "roastLines": roast_lines,
        "redemption": (
            f"BUT SERIOUSLY... {username} keeps shipping, and consistency beats flashy hype every single sprint."
        ),
        "roastScore": roast_score,
    }


def _build_roast_user_prompt(metrics: dict[str, Any], profile_payload: dict[str, Any]) -> str:
    top_langs = ", ".join(
        f"{item['language']} ({item['percentage']}%)" for item in metrics["top_languages"][:3]
    ) or "Unknown"
    messages_blob = "\n".join(metrics["commit_messages"][:15]) or "No commit messages available"
    avg_hour = metrics["avg_commit_hour"]
    avg_hour_display = f"{avg_hour:.2f} UTC" if avg_hour is not None else "unknown"

    return (
        "Roast this developer using their real profile values and return ONLY JSON.\n"
        f"username: {metrics['username']}\n"
        f"dev_class: {metrics['dev_class']}\n"
        f"total_stars: {metrics['total_stars']}\n"
        f"followers: {metrics['followers']}\n"
        f"public_repos: {metrics['public_repos']}\n"
        f"average_commit_hour_utc: {avg_hour_display}\n"
        f"recent_commits_30d: {metrics['recent_commits_30d']}\n"
        f"top_languages: {top_langs}\n"
        f"lazy_commit_ratio: {metrics['lazy_ratio']:.3f}\n"
        "recent_commit_messages:\n"
        f"{messages_blob}\n\n"
        "full_profile_payload_json:\n"
        f"{json.dumps(profile_payload)}"
    )


def _normalize_roast_result(parsed: dict[str, Any], fallback: dict[str, Any], lazy_ratio: float) -> dict[str, Any]:
    result = json.loads(json.dumps(fallback))
    if not isinstance(parsed, dict):
        result["roastLines"] = _add_lazy_commit_line_if_needed(result["roastLines"], lazy_ratio)
        return result

    roast_lines = parsed.get("roastLines")
    if isinstance(roast_lines, list):
        clean_lines = [str(item).strip() for item in roast_lines if isinstance(item, str) and item.strip()]
        if clean_lines:
            result["roastLines"] = clean_lines

    redemption = parsed.get("redemption")
    if isinstance(redemption, str) and redemption.strip():
        result["redemption"] = redemption.strip()

    roast_score = _to_float(parsed.get("roastScore"), None)
    if roast_score is not None:
        result["roastScore"] = _clamp_int(roast_score)

    if len(result["roastLines"]) < 5:
        missing = [line for line in fallback["roastLines"] if line not in result["roastLines"]]
        result["roastLines"].extend(missing[: 5 - len(result["roastLines"])])

    result["roastLines"] = _add_lazy_commit_line_if_needed(result["roastLines"], lazy_ratio)
    return result


def _extract_newspaper_context(profile_payload: dict[str, Any]) -> dict[str, Any]:
    github_data = _extract_github_section(profile_payload)
    metrics = _extract_metrics(github_data)

    ai_section = profile_payload.get("ai")
    if not isinstance(ai_section, dict):
        ai_section = profile_payload.get("aiData")
    ai_section = ai_section if isinstance(ai_section, dict) else {}

    chronotype = ai_section.get("chronotype") if isinstance(ai_section.get("chronotype"), dict) else {}
    work_style = str(chronotype.get("workStyle") or "Adaptive Rhythm Coder")
    dev_class = str(ai_section.get("devClass") or "Steady Commit Craftsman")

    top_language = metrics["top_languages"][0]["language"] if metrics["top_languages"] else "Unknown"
    top_language_share = metrics["top_languages"][0]["percentage"] if metrics["top_languages"] else 0.0

    dev_score = _to_int(profile_payload.get("devScore"), 0)
    if dev_score <= 0:
        traits = ai_section.get("traits") if isinstance(ai_section.get("traits"), dict) else {}
        inferred_score = (
            _to_int(traits.get("discipline"), 0)
            + _to_int(traits.get("depth"), 0)
            + _to_int(traits.get("velocity"), 0)
        ) / 3
        dev_score = _clamp_int(inferred_score)

    achievements = profile_payload.get("achievements") if isinstance(profile_payload.get("achievements"), dict) else {}
    unlocked_achievements = _to_int(achievements.get("unlockedCount"), 0)
    total_achievements = _to_int(achievements.get("totalCount"), 0)

    return {
        "username": metrics["username"],
        "dev_class": dev_class,
        "dev_score": dev_score,
        "work_style": work_style,
        "total_stars": metrics["total_stars"],
        "followers": metrics["followers"],
        "public_repos": metrics["public_repos"],
        "recent_commits_30d": metrics["recent_commits_30d"],
        "account_age_years": metrics["account_age_years"],
        "top_language": top_language,
        "top_language_share": top_language_share,
        "top_repo": metrics["top_starred_repo_name"] or "unknown",
        "top_repo_stars": metrics["top_starred_repo_stars"],
        "unlocked_achievements": unlocked_achievements,
        "total_achievements": total_achievements,
    }


def _fallback_newspaper(profile_payload: dict[str, Any]) -> dict[str, Any]:
    context = _extract_newspaper_context(profile_payload)
    username = context["username"]
    stars = context["total_stars"]
    repos = context["public_repos"]
    commits = context["recent_commits_30d"]
    followers = context["followers"]
    dev_score = context["dev_score"]
    work_style = context["work_style"]
    top_language = context["top_language"]
    top_language_share = context["top_language_share"]
    top_repo = context["top_repo"]
    top_repo_stars = context["top_repo_stars"]
    account_age_years = context["account_age_years"]
    unlocked_achievements = context["unlocked_achievements"]
    total_achievements = context["total_achievements"]

    edition_label = f"{username.upper()} EDITION"
    date_line = datetime.now(timezone.utc).strftime("%B %d, %Y")

    return {
        "masthead": "GITHUB NEWSPAPER",
        "editionLabel": edition_label,
        "dateLine": date_line,
        "ticker": (
            f"LIVE METRICS | {stars} stars | {commits} commits in 30d | {repos} repositories | "
            f"{followers} followers"
        ),
        "headline": f"@{username} pushes {commits} commits and {stars} stars into the spotlight",
        "subheadline": (
            f"{work_style} rhythm, {repos} public repositories, and a {dev_score} dev score define this profile's current arc."
        ),
        "leadStory": (
            f"{username} now operates as a {context['dev_class']}, balancing a {account_age_years:.2f}-year tenure with "
            f"active output. The account carries {repos} repositories and {stars} stars, while {commits} recent commits "
            "indicate sustained shipping pressure rather than isolated bursts."
        ),
        "secondaryTitle": "Repository Watch",
        "secondaryStory": (
            f"Top impact project is {top_repo} with {top_repo_stars} stars. Language signal is led by {top_language} "
            f"at {top_language_share:.2f} percent, showing where most execution energy is concentrated."
        ),
        "editorialTitle": "Editorial: Ship With Intent",
        "editorial": (
            f"Momentum is clear, but long-term clarity still depends on disciplined communication. With {commits} commits in 30 days, "
            "the next multiplier comes from preserving context in every change, not only shipping speed."
        ),
        "sidebarTitle": "Data Desk",
        "sidebarBullets": [
            f"Dev Score: {dev_score}",
            f"Followers: {followers}",
            f"Top Language: {top_language} ({top_language_share:.2f}%)",
            f"Achievement Vault: {unlocked_achievements}/{total_achievements}",
            f"Account Age: {account_age_years:.2f} years",
        ],
        "pullQuote": (
            f"{commits} commits in 30 days means this developer is shipping at a pace that forces the roadmap to keep up."
        ),
        "footerNote": "Printed by GitDNA Press | Built from public GitHub telemetry",
    }


def _build_newspaper_user_prompt(context: dict[str, Any], profile_payload: dict[str, Any]) -> str:
    return (
        "Generate a full front-page developer newspaper and return ONLY JSON.\n"
        "Use this exact schema and no extra keys:\n"
        "{\n"
        '  "masthead": "string",\n'
        '  "editionLabel": "string",\n'
        '  "dateLine": "string",\n'
        '  "ticker": "string",\n'
        '  "headline": "string",\n'
        '  "subheadline": "string",\n'
        '  "leadStory": "string",\n'
        '  "secondaryTitle": "string",\n'
        '  "secondaryStory": "string",\n'
        '  "editorialTitle": "string",\n'
        '  "editorial": "string",\n'
        '  "sidebarTitle": "string",\n'
        '  "sidebarBullets": ["string", "string", "string", "string", "string"],\n'
        '  "pullQuote": "string",\n'
        '  "footerNote": "string"\n'
        "}\n\n"
        "Rules:\n"
        "- Headline must be under 14 words.\n"
        "- Use at least four concrete numbers from the profile.\n"
        "- Keep each story factual and punchy (no markdown).\n"
        "- sidebarBullets must contain 4 to 6 short bullet lines.\n\n"
        f"profile_context_json:\n{json.dumps(context)}\n\n"
        f"full_profile_payload_json:\n{json.dumps(profile_payload)}"
    )


def _normalize_newspaper_result(parsed: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    result = json.loads(json.dumps(fallback))
    if not isinstance(parsed, dict):
        return result

    for key in (
        "masthead",
        "editionLabel",
        "dateLine",
        "ticker",
        "headline",
        "subheadline",
        "leadStory",
        "secondaryTitle",
        "secondaryStory",
        "editorialTitle",
        "editorial",
        "sidebarTitle",
        "pullQuote",
        "footerNote",
    ):
        value = parsed.get(key)
        if isinstance(value, str) and value.strip():
            result[key] = value.strip()

    sidebar_bullets = parsed.get("sidebarBullets")
    if isinstance(sidebar_bullets, list):
        clean = [str(item).strip()[:180] for item in sidebar_bullets if str(item).strip()]
        if len(clean) >= 3:
            result["sidebarBullets"] = clean[:6]

    return result


async def analyze_newspaper(profile_payload: dict[str, Any]) -> dict[str, Any]:
    fallback = _fallback_newspaper(profile_payload)
    context = _extract_newspaper_context(profile_payload)

    if not _has_groq_key():
        return fallback

    try:
        user_prompt = _build_newspaper_user_prompt(context, profile_payload)
        raw_content = await call_groq(
            user_prompt,
            NEWSPAPER_SYSTEM_PROMPT,
            max_tokens=1200,
            temperature=0.55,
            model_candidates=GROQ_STRUCTURED_MODEL_CANDIDATES,
            timeout_seconds=GROQ_STRUCTURED_TIMEOUT_SECONDS,
        )

        parsed = _safe_json_parse(raw_content)
        if parsed is None:
            return fallback
        return _normalize_newspaper_result(parsed, fallback)
    except Exception:
        return fallback


async def analyze_battle(left_payload: dict[str, Any], right_payload: dict[str, Any]) -> str:
    fallback = _battle_fallback(left_payload, right_payload)
    if not _has_groq_key():
        return fallback

    left_github = _extract_github_section(left_payload)
    right_github = _extract_github_section(right_payload)
    left = _extract_metrics(left_github)
    right = _extract_metrics(right_github)

    user_prompt = (
        "Compare these two developer profiles. Who wins in a code review? "
        "Who ships faster? Who writes more maintainable code? Be direct and opinionated.\n\n"
        f"Left profile: {json.dumps(left)}\n"
        f"Right profile: {json.dumps(right)}"
    )

    try:
        text = (await call_groq(user_prompt, BATTLE_SYSTEM_PROMPT, max_tokens=260, temperature=0.5)).replace("```", "").strip()
        return text or fallback
    except Exception:
        return fallback


async def analyze_roast(profile_payload: dict[str, Any]) -> dict[str, Any]:
    fallback = _fallback_roast(profile_payload)
    metrics = _extract_roast_metrics(profile_payload)

    if not _has_groq_key():
        return fallback

    try:
        raw_content = await call_groq(
            _build_roast_user_prompt(metrics, profile_payload),
            ROAST_SYSTEM_PROMPT,
            max_tokens=900,
            temperature=0.7,
            model_candidates=GROQ_STRUCTURED_MODEL_CANDIDATES,
            timeout_seconds=GROQ_STRUCTURED_TIMEOUT_SECONDS,
        )

        parsed = _safe_json_parse(raw_content)
        if parsed is None:
            return fallback
        return _normalize_roast_result(parsed, fallback, metrics["lazy_ratio"])
    except Exception:
        return fallback


def _fallback_time_machine_narration(payload: dict[str, Any]) -> dict[str, Any]:
    username = str(payload.get("username") or "developer")
    year_data = payload.get("yearData") if isinstance(payload.get("yearData"), list) else []
    first_language = str(payload.get("firstLanguage") or "Unknown")
    current_language = str(payload.get("currentLanguage") or "Unknown")
    velocity_multiplier = _to_float(payload.get("velocityMultiplier"), 1.0) or 1.0

    year_narrations: dict[str, str] = {}
    for item in year_data:
        if not isinstance(item, dict):
            continue
        year = str(item.get("year") or "unknown")
        commits = _to_int(item.get("commits"), 0)
        language = str(item.get("language") or current_language or "code")
        year_narrations[year] = (
            f"{year}: {username} pushed {commits} tracked commits with {language}, building steady momentum through visible output."
        )

    if not year_narrations:
        year_narrations = {
            "present": (
                f"{username} keeps shipping with measurable consistency, even when yearly telemetry is sparse."
            )
        }

    return {
        "yearNarrations": year_narrations,
        "evolutionSummary": (
            f"The journey moved from {first_language} foundations to {current_language} execution focus. "
            f"Current velocity signal sits around {velocity_multiplier:.1f}x, indicating sustained iteration pressure."
        ),
        "heroTitle": "Relentless Commit Navigator",
        "originStory": (
            f"At the start, {username} was a builder learning in public, one commit at a time."
        ),
    }


async def analyze_time_machine_narration(payload: dict[str, Any]) -> dict[str, Any]:
    fallback = _fallback_time_machine_narration(payload)
    if not _has_groq_key():
        return fallback

    username = str(payload.get("username") or "unknown")
    year_data = payload.get("yearData") if isinstance(payload.get("yearData"), list) else []
    first_language = str(payload.get("firstLanguage") or "Unknown")
    current_language = str(payload.get("currentLanguage") or "Unknown")
    velocity_multiplier = payload.get("velocityMultiplier")
    total_years_active = payload.get("totalYearsActive")

    user_prompt = (
        "Narrate this developer's journey year by year.\n"
        f"Username: {username}\n"
        f"Years data: {json.dumps(year_data)}\n\n"
        "Return exactly this JSON structure:\n"
        "{\n"
        '  "yearNarrations": {\n'
        '    "2019": "one cinematic sentence about that year",\n'
        '    "2020": "one cinematic sentence about that year"\n'
        "  },\n"
        '  "evolutionSummary": "two sentences. First: their journey arc from '
        f"{first_language}"
        " to "
        f"{current_language}"
        '. Second: velocity insight using the '
        f"{velocity_multiplier}"
        'x number.",\n'
        '  "heroTitle": "a 3-5 word legendary title earned from their full journey",\n'
        '  "originStory": "one dramatic sentence about the very first year. What kind of developer were they when they started."\n'
        "}\n"
        f"Total years active: {total_years_active}."
    )

    try:
        raw_content = await call_groq(
            user_prompt,
            TIME_MACHINE_SYSTEM_PROMPT,
            max_tokens=1100,
            temperature=0.62,
            model_candidates=GROQ_STRUCTURED_MODEL_CANDIDATES,
            timeout_seconds=GROQ_STRUCTURED_TIMEOUT_SECONDS,
        )
        parsed = _safe_json_parse(raw_content)
        if parsed is None:
            return fallback
        return parsed
    except Exception:
        return fallback


async def analyze_gitmap_insight(payload: dict[str, Any]) -> str:
    username = str(payload.get("username") or "unknown")
    city = str(payload.get("city") or "Unknown City")
    country = str(payload.get("country") or "Unknown Country")
    top_lang = str(payload.get("topLang") or "JavaScript")
    total_stars = _to_int(payload.get("totalStars"), 0)
    account_age = round(_to_float(payload.get("accountAge"), 0.0) or 0.0, 1)
    recent_commits = _to_int(payload.get("recentCommits"), 0)

    fallback = (
        f"{username} codes from {city}, {country} with {top_lang}, {total_stars} stars, "
        f"{recent_commits} recent commits, and {account_age} years on GitHub, signaling "
        f"{'strong' if total_stars >= 100 else 'growing'} regional momentum."
    )

    if not _has_groq_key():
        return fallback

    user_prompt = (
        "Generate one high-signal sentence for the GitMap broadcast line.\n"
        f"username: {username}\n"
        f"city: {city}\n"
        f"country: {country}\n"
        f"top_language: {top_lang}\n"
        f"total_stars: {total_stars}\n"
        f"recent_commits_30d: {recent_commits}\n"
        f"account_age_years: {account_age}\n"
        "Rules: 16-30 words, one sentence only, no markdown, no emojis, no hashtags."
    )

    try:
        text = (await call_groq(user_prompt, GITMAP_INSIGHT_SYSTEM_PROMPT, max_tokens=120, temperature=0.55)).replace("```", "").strip()
        text = re.sub(r"\s+", " ", text)
        if not text:
            return fallback

        sentence = re.split(r"(?<=[.!?])\s+", text)[0].strip()
        if not sentence:
            return fallback
        if sentence[-1] not in ".!?":
            sentence = f"{sentence}."

        return sentence[:280]
    except Exception:
        return fallback


def _fallback_commit_linguistics_insight(username: str, messages: list[str]) -> str:
    safe_messages = [str(message).strip() for message in messages if str(message).strip()][:20]
    if not safe_messages:
        return (
            "No recent commit messages were available, so there is not enough writing data to infer style yet."
        )

    graded = [_grade_commit_message(message) for message in safe_messages]
    top_tier = sum(1 for item in graded if item["grade"] in {"A+", "A"})
    weak_tier = sum(1 for item in graded if item["grade"] in {"F", "D"})
    avg_length = round(sum(len(message) for message in safe_messages) / max(1, len(safe_messages)))

    if top_tier >= max(1, round(len(safe_messages) * 0.45)):
        return (
            f"@{username} tends to write intent-first commit messages with consistent action verbs and useful scope, "
            f"which signals clear execution discipline; average message length is {avg_length} characters, balancing "
            "brevity with context for future readers."
        )

    if weak_tier >= max(1, round(len(safe_messages) * 0.35)):
        return (
            f"@{username} appears to ship quickly but often drops context in commit logs, which suggests delivery "
            "urgency outruns communication discipline; the message trail favors short placeholders over explicit intent."
        )

    return (
        f"@{username} shows mixed commit language, with enough clear entries to track progress but periodic vague "
        "messages that reduce historical traceability; tightening each message to action plus affected scope would "
        "make collaboration and rollback reasoning far easier."
    )


async def analyze_commit_linguistics(commit_messages: list[str], username: str, top_lang: str) -> str:
    safe_messages = [str(message).strip() for message in commit_messages if str(message).strip()][:20]
    if not safe_messages:
        return (
            f"No recent public commits available for {username}. "
            "This could indicate private repository activity or a recent hiatus."
        )

    avg_len = sum(len(message) for message in safe_messages) / len(safe_messages)
    conventional = sum(
        1
        for message in safe_messages
        if re.match(r"^(feat|fix|docs|refactor|chore|perf|test):", message, re.IGNORECASE)
    )
    vague = sum(
        1
        for message in safe_messages
        if re.match(r"^(fix|wip|update|test|temp)$", message, re.IGNORECASE)
    )

    sample = "\n".join(f'- "{message}"' for message in safe_messages[:12])
    prompt = (
        f"Analyze these commit messages from @{username} ({top_lang} developer):\n\n"
        f"{sample}\n\n"
        f"Stats: {len(safe_messages)} messages, avg {avg_len:.0f} chars, "
        f"{conventional} conventional format, {vague} vague/single-word.\n\n"
        "Write 2-3 sentences analyzing their communication style and "
        "what it reveals about how they work under pressure. "
        "Be specific - reference actual patterns you see. "
        "Do NOT start with 'The developer' - start differently each time."
    )

    if not _has_groq_key():
        return (
            f"Pattern analysis: {len(safe_messages)} commits analyzed. "
            f"Average message length of {avg_len:.0f} characters suggests "
            f"{'deliberate documentation' if avg_len > 40 else 'rapid-fire shipping style'}."
        )

    try:
        text = await call_groq(prompt, COMMIT_LINGUISTICS_SYSTEM_PROMPT, max_tokens=200, temperature=0.55)
        return text or (
            f"Pattern analysis: {len(safe_messages)} commits analyzed. "
            f"Average message length of {avg_len:.0f} characters suggests "
            f"{'deliberate documentation' if avg_len > 40 else 'rapid-fire shipping style'}."
        )
    except Exception:
        return (
            f"Pattern analysis: {len(safe_messages)} commits analyzed. "
            f"Average message length of {avg_len:.0f} characters suggests "
            f"{'deliberate documentation' if avg_len > 40 else 'rapid-fire shipping style'}."
        )


def _grade_commit_message(message: str) -> dict[str, Any]:
    normalized = re.sub(r"\s+", " ", str(message or "")).strip()
    lowered = normalized.lower()
    words = len([word for word in normalized.split(" ") if word]) if normalized else 0
    chars = len(normalized)

    literal_bans = {"fix", ".", "asdf"}
    conventional_scope = re.compile(r"^(feat|fix|chore|refactor|docs)\([a-z0-9._/-]+\):\s+.+", re.IGNORECASE)
    conventional = re.compile(r"^(feat|fix|chore|refactor|docs):\s+.+", re.IGNORECASE)
    action_verb = re.compile(
        r"\b(add|fix|refactor|remove|improve|optimi[sz]e|implement|update|migrate|rename|clean|document|test|handle|support|create|prevent)\b",
        re.IGNORECASE,
    )
    vague_short = re.compile(r"^(fix|update|test|change|misc|tmp|temp|work|stuff|quick)\b", re.IGNORECASE)

    grade = "D"
    if not normalized or lowered in literal_bans or words <= 1:
        grade = "F"
    elif conventional_scope.search(normalized) and chars >= 18:
        grade = "A+"
    elif conventional.search(normalized):
        grade = "A"
    elif 40 <= chars <= 72 and action_verb.search(normalized):
        grade = "B"
    elif 15 <= chars < 40 and action_verb.search(normalized):
        grade = "C"
    elif chars < 15 and vague_short.search(normalized):
        grade = "D"
    elif chars >= 15 and action_verb.search(normalized):
        grade = "C"

    points_map = {"A+": 10, "A": 8, "B": 6, "C": 4, "D": 2, "F": 0}
    return {
        "grade": grade,
        "points": points_map.get(grade, 2),
        "message": normalized or "(empty commit message)",
    }


async def analyze_commit_linguistics_insight(payload: dict[str, Any]) -> str:
    username = str(payload.get("username") or "developer")
    raw_messages = payload.get("commitMessages") if isinstance(payload.get("commitMessages"), list) else []
    commit_messages = [str(message).strip()[:160] for message in raw_messages if str(message).strip()]
    top_lang = str(payload.get("topLang") or payload.get("top_lang") or "code")
    text = await analyze_commit_linguistics(commit_messages, username, top_lang)
    cleaned = re.sub(r"\s+", " ", str(text or "")).strip()[:360]
    if cleaned and cleaned[-1] not in ".!?":
        cleaned = f"{cleaned}."

    if cleaned:
        return cleaned
    return _fallback_commit_linguistics_insight(username, commit_messages[:20])


def _select_dev_class(metrics: dict[str, Any]) -> str:
    stars = metrics["total_stars"]
    repos = metrics["public_repos"]
    commits_30d = metrics["recent_commits_30d"]
    stars_per_repo = stars / max(1, repos)
    night_ratio = metrics["night_commit_ratio"]
    weekend_ratio = metrics["weekend_weekday_ratio"] if metrics["weekend_weekday_ratio"] is not None else 0.0
    language_diversity = metrics["language_diversity"]
    active_90d = metrics["active_repos_90d"]
    lazy_ratio = metrics["commit_message_lazy_ratio"]

    if repos <= 8 and stars_per_repo >= 4:
        return "Precision Impact Builder"
    if commits_30d >= 35 and night_ratio >= 0.4:
        return "Midnight Ship Commander"
    if active_90d >= max(5, int(repos * 0.45)) and commits_30d >= 20:
        return "Release Train Operator"
    if language_diversity >= 6:
        return "Polyglot Systems Mapper"
    if weekend_ratio >= 0.8 and commits_30d >= 12:
        return "Weekend Refactor Ranger"
    if lazy_ratio >= 0.4 and commits_30d >= 10:
        return "Rapid Patch Firefighter"
    if stars >= 1000 or metrics["followers"] >= 300:
        return "Public Signal Architect"
    return "Steady Commit Craftsman"


def _select_archetype_name(metrics: dict[str, Any]) -> str:
    repos = metrics["public_repos"]
    active_30d = metrics["active_repos_30d"]
    active_90d = metrics["active_repos_90d"]
    stale_180d = metrics["stale_repos_180d"]
    top_repo_stars = metrics["top_starred_repo_stars"]
    fork_repos = metrics["fork_repo_count"]

    if top_repo_stars >= 500:
        return "Impact Beacon Architect"
    if repos >= 120:
        return "Repository Forge Strategist"
    if active_30d >= 10:
        return "High Velocity Maintainer"
    if active_90d >= max(8, int(repos * 0.6)):
        return "Momentum Grid Operator"
    if stale_180d >= max(10, int(repos * 0.5)):
        return "Archive Layer Strategist"
    if fork_repos >= max(6, int(repos * 0.35)):
        return "Remix Stack Integrator"
    return "Signal Weighted Architect"


def _select_collab_title(metrics: dict[str, Any]) -> str:
    followers = metrics["followers"]
    repos = metrics["public_repos"]
    fork_repos = metrics["fork_repo_count"]
    top_repo_stars = metrics["top_starred_repo_stars"]

    if followers >= 400 or top_repo_stars >= 300:
        return "Community Gravity Well"
    if fork_repos >= max(6, int(repos * 0.3)):
        return "Open Source Integrator"
    if repos >= 70 and followers < 80:
        return "Solo Lab Operator"
    if metrics["active_repos_30d"] >= 7:
        return "Async Sprint Collaborator"
    return "Asynchronous Builder"


def _build_fast_facts(metrics: dict[str, Any]) -> list[str]:
    username = metrics["username"]
    stars = metrics["total_stars"]
    repos = metrics["public_repos"]
    top_lang = metrics["top_languages"][0] if metrics["top_languages"] else {"language": "Unknown", "percentage": 0.0}
    commits_30d = metrics["recent_commits_30d"]
    active_90d = metrics["active_repos_90d"]
    lazy_ratio = metrics["commit_message_lazy_ratio"]
    lexical = metrics["commit_message_lexical_diversity"]
    peak_hour = metrics["peak_commit_hour"]
    top_repo = metrics["top_starred_repo_name"] or "unknown"
    top_repo_stars = metrics["top_starred_repo_stars"]
    terms = metrics["commit_message_top_terms"]
    top_terms_line = ", ".join(terms[:3]) if terms else "no clear signal"

    peak_line = f"peak commit window around {peak_hour:02d}:00 UTC" if peak_hour is not None else "commit timing spread across the day"

    return [
        f"{username} runs {repos} public repos with {stars} stars; top impact repo is {top_repo} ({top_repo_stars} stars).",
        f"{commits_30d} commits in 30 days with {active_90d} active repos in 90 days indicates sustained execution, not one-off spikes.",
        f"Commit style signal: lazy-ratio {lazy_ratio:.0%}, lexical diversity {lexical:.2f}, recurring terms {top_terms_line}, and {peak_line}.",
    ]


def _calculate_base_traits(metrics: dict[str, Any], github_data: dict[str, Any]) -> dict[str, int]:
    total_stars = max(0, _to_int(metrics.get("total_stars"), 0))
    repos_payload = github_data.get("repos") if isinstance(github_data.get("repos"), list) else []
    total_repos = max(0, _to_int(metrics.get("public_repos"), 0), len(repos_payload))
    followers = max(0, _to_int(metrics.get("followers"), 0))

    user_payload = github_data.get("user") if isinstance(github_data.get("user"), dict) else {}
    following = max(0, _to_int(user_payload.get("following"), 0))
    account_age = max(0.0, _to_float(metrics.get("account_age_years"), 0.0) or 0.0)
    recent_commits = max(0, _to_int(metrics.get("recent_commits_30d"), 0))

    top_languages_raw = metrics.get("top_languages") if isinstance(metrics.get("top_languages"), list) else []
    top_langs = []
    for item in top_languages_raw:
        if not isinstance(item, dict):
            continue
        language = str(item.get("language") or item.get("lang") or "").strip()
        if not language or language.lower() == "unknown":
            continue
        pct = _to_float(item.get("percentage"), None)
        if pct is None:
            pct = _to_float(item.get("pct"), 0.0) or 0.0
        top_langs.append({"lang": language, "pct": float(pct)})

    language_count = max(0, _to_int(metrics.get("language_diversity"), 0))
    if language_count == 0:
        language_count = len(top_langs)

    avg_commit_hour = _to_float(metrics.get("avg_commit_hour"), 12.0)
    if avg_commit_hour is None:
        avg_commit_hour = 12.0

    weekend_commits = max(0, _to_int(metrics.get("weekend_commits"), 0))
    weekday_commits = max(0, _to_int(metrics.get("weekday_commits"), 0))
    weekend_ratio = 0.0
    if (weekend_commits + weekday_commits) > 0:
        weekend_ratio = weekend_commits / (weekend_commits + weekday_commits)

    commit_messages = metrics.get("last_commit_messages") if isinstance(metrics.get("last_commit_messages"), list) else []
    normalized_messages = [str(message).strip() for message in commit_messages if str(message).strip()]

    bio = str(user_payload.get("bio") or "")
    blog = str(user_payload.get("blog") or "")

    # CREATIVITY (0-100)
    creativity = 40
    creativity += min(25, language_count * 5)
    stars_per_repo = (total_stars / total_repos) if total_repos > 0 else 0.0
    creativity += min(20, round(stars_per_repo * 2))
    if avg_commit_hour >= 20 or avg_commit_hour <= 5:
        creativity += 10
    if weekend_ratio > 0.2:
        creativity += 5
    creativity = _clamp_int(creativity, 5, 100)

    # DISCIPLINE (0-100)
    discipline = 40
    if normalized_messages:
        conventional_count = sum(
            1
            for message in normalized_messages
            if re.match(r"^(feat|fix|docs|refactor|chore|perf|test|style|build|ci):", message, re.IGNORECASE)
        )
        discipline += min(30, round((conventional_count / len(normalized_messages)) * 30))
    discipline += min(20, round(account_age * 4))
    if recent_commits > 10:
        discipline += 10
    discipline = _clamp_int(discipline, 5, 100)

    # COLLABORATION (0-100)
    collaboration = 30
    collaboration += min(25, round((followers ** 0.5) * 3))
    follow_ratio = min(2.0, (followers / following)) if following > 0 else 0.0
    collaboration += min(15, round(follow_ratio * 8))
    if bio and re.search(r"open.source|contributor|team|collaborat", bio, re.IGNORECASE):
        collaboration += 15
    if blog.strip():
        collaboration += 5
    collaboration = _clamp_int(collaboration, 5, 100)

    # BOLDNESS (0-100)
    boldness = 35
    boldness += min(30, round((math.log10(total_stars + 1)) * 15))
    if recent_commits > 15:
        boldness += 15
    primary_language = top_langs[0]["lang"] if top_langs else ""
    if primary_language in {"Rust", "C"}:
        boldness += 15
    if primary_language == "Assembly":
        boldness += 20
    boldness = _clamp_int(boldness, 5, 100)

    # DEPTH (0-100)
    depth = 35
    primary_pct = float(top_langs[0]["pct"]) if top_langs else 0.0
    if primary_pct >= 60:
        depth += 20
    depth += min(20, round(account_age * 3.5))
    max_single_repo_stars = 0
    for repo in repos_payload:
        if not isinstance(repo, dict):
            continue
        repo_stars = max(0, _to_int(repo.get("stargazers_count") or repo.get("stars"), 0))
        if repo_stars > max_single_repo_stars:
            max_single_repo_stars = repo_stars
    depth += min(20, round((math.log10(max_single_repo_stars + 1)) * 10))
    if normalized_messages:
        avg_msg_len = sum(len(message) for message in normalized_messages) / len(normalized_messages)
        depth += min(10, round(avg_msg_len / 10))
    depth = _clamp_int(depth, 5, 100)

    # VELOCITY (0-100)
    velocity = 30
    repos_per_year = (total_repos / account_age) if account_age > 0 else total_repos
    velocity += min(30, round(repos_per_year * 3))
    velocity += min(30, round(recent_commits * 2))
    if weekend_ratio > 0.3:
        velocity += 10
    velocity = _clamp_int(velocity, 5, 100)

    return {
        "creativity": creativity,
        "discipline": discipline,
        "collaboration": collaboration,
        "boldness": boldness,
        "depth": depth,
        "velocity": velocity,
    }


def _fallback_analysis(github_data: dict[str, Any], base_traits: dict[str, int]) -> dict[str, Any]:
    """
    Pure algorithmic fallback with deterministic personalization.
    """
    metrics = _extract_metrics(github_data)

    username = str(metrics.get("username") or "developer")
    avg_hour_raw = metrics.get("avg_commit_hour")
    avg_hour = int(avg_hour_raw) if avg_hour_raw is not None else 14
    stars = _to_int(metrics.get("total_stars"), 0)
    repos = _to_int(metrics.get("public_repos"), 0)
    account_age = max(0.0, _to_float(metrics.get("account_age_years"), 1.0) or 1.0)
    top_langs = metrics.get("top_languages") if isinstance(metrics.get("top_languages"), list) else []
    top_lang = str(top_langs[0].get("language") or "code") if top_langs else "code"
    followers = _to_int(metrics.get("followers"), 0)

    safe_traits = {
        trait: _clamp_int(_to_float(base_traits.get(trait), 50) or 50, 5, 100)
        for trait in ("creativity", "discipline", "collaboration", "boldness", "depth", "velocity")
    }

    chronotype_map = {
        range(0, 5): ("Midnight Architect", "codes in absolute darkness"),
        range(5, 9): ("Dawn Protocol Engineer", "commits before the world wakes"),
        range(9, 13): ("Morning Systems Builder", "runs on coffee and clarity"),
        range(13, 17): ("Afternoon Velocity Engine", "peaks when the market opens"),
        range(17, 21): ("Evening Runtime", "deploys after dark"),
        range(21, 24): ("Late Orbit Coder", "orbits the deadline"),
    }
    chron_title, chron_style = next(
        (value for key, value in chronotype_map.items() if avg_hour in key),
        ("Temporal Drifter", "operates outside normal time"),
    )

    tier = (
        "LEGENDARY"
        if stars > 10000
        else "ELITE"
        if stars > 1000
        else "VETERAN"
        if stars > 100
        else "RISING"
    )

    dna_source = (username + str(stars))[:16].ljust(16, "0")
    dna_sequence = "".join(format(ord(char) % 16, "X") for char in dna_source)

    return {
        "devClass": f"The {top_lang} {'Architect' if safe_traits.get('discipline', 50) > 60 else 'Hacker'}",
        "archetype": {
            "name": chron_title,
            "tier": tier,
            "description": f"{stars} stars across {repos} repositories in {account_age:.1f} years. The numbers are honest - they always are.",
        },
        "chronotype": {
            "title": chron_title,
            "description": f"Peak activity at {avg_hour}:00 UTC - {chron_style}. The commit log doesn't lie about when this developer is most alive.",
            "workStyle": chron_style,
        },
        "collaborationStyle": {
            "title": "The Silent Builder" if followers < 50 else "The Community Node",
            "description": f"{followers} developers follow this work. {'The audience is growing.' if followers > 20 else 'The work speaks for itself.'}",
            "score": min(80, max(20, followers // 2)),
        },
        "traits": safe_traits,
        "fastFacts": [
            f"{stars} stars across {repos} repositories. That's {stars / max(repos, 1):.1f} stars per repo. The market has spoken.",
            f"Peak commit hour: {avg_hour}:00 UTC. {chron_style.capitalize()}.",
            f"{account_age:.1f} years on GitHub. That's {int(account_age * 365)} days of showing up.",
        ],
        "dnaSequence": dna_sequence,
        "strengthReport": f"Consistent {top_lang} output over {account_age:.1f} years signals deep expertise.",
        "warningSign": "Public event data is limited - full pattern analysis requires more recent activity.",
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


def _is_generic_label(value: str) -> bool:
    lowered = (value or "").strip().lower()
    if not lowered:
        return True
    generic_labels = {
        "the silent builder",
        "silent builder",
        "asynchronous builder",
        "unknown archetype",
        "signal weighted architect",
        "developer",
    }
    return lowered in generic_labels


def _normalize_result(parsed: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    result = json.loads(json.dumps(fallback))
    if not isinstance(parsed, dict):
        return result

    for key in ("strengthReport", "warningSign"):
        value = parsed.get(key)
        if isinstance(value, str) and value.strip():
            result[key] = value.strip()

    dev_class = parsed.get("devClass")
    if isinstance(dev_class, str) and dev_class.strip() and not _is_generic_label(dev_class):
        result["devClass"] = dev_class.strip()

    dna_sequence = parsed.get("dnaSequence")
    if isinstance(dna_sequence, str) and _valid_dna(dna_sequence.strip().upper()):
        result["dnaSequence"] = dna_sequence.strip().upper()

    parsed_archetype = parsed.get("archetype")
    if isinstance(parsed_archetype, dict):
        archetype_name = parsed_archetype.get("name")
        if isinstance(archetype_name, str) and archetype_name.strip() and not _is_generic_label(archetype_name):
            result["archetype"]["name"] = archetype_name.strip()

        archetype_description = parsed_archetype.get("description")
        if isinstance(archetype_description, str) and archetype_description.strip():
            result["archetype"]["description"] = archetype_description.strip()
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
        collab_title = parsed_collab.get("title")
        if isinstance(collab_title, str) and collab_title.strip() and not _is_generic_label(collab_title):
            result["collaborationStyle"]["title"] = collab_title.strip()

        collab_description = parsed_collab.get("description")
        if isinstance(collab_description, str) and collab_description.strip():
            result["collaborationStyle"]["description"] = collab_description.strip()
        score = _to_float(parsed_collab.get("score"), None)
        if score is not None:
            result["collaborationStyle"]["score"] = _clamp_int(score)

    parsed_traits = parsed.get("traits")
    if isinstance(parsed_traits, dict):
        for trait in ("creativity", "discipline", "collaboration", "boldness", "depth", "velocity"):
            score = _to_float(parsed_traits.get(trait), None)
            if score is not None:
                ai_score = _clamp_int(score)
                base_score = _to_int(result["traits"].get(trait), 50)
                bounded_score = max(base_score - 8, min(base_score + 8, ai_score))
                result["traits"][trait] = _clamp_int(bounded_score)

    fast_facts = parsed.get("fastFacts")
    if isinstance(fast_facts, list):
        clean = [str(item).strip() for item in fast_facts if isinstance(item, str) and item.strip()]
        if clean:
            merged = (clean + result["fastFacts"])[:3]
            result["fastFacts"] = merged

    return result


def _build_user_prompt(metrics: dict[str, Any], base_traits: dict[str, int]) -> str:
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

    signature_seed = (
        f"{metrics['username']}|{metrics['total_stars']}|{metrics['public_repos']}|"
        f"{metrics['recent_commits_30d']}|{metrics['active_repos_90d']}|"
        f"{metrics['language_diversity']}|{metrics['commit_message_lazy_ratio']}"
    )
    profile_signature = hashlib.sha1(signature_seed.encode("utf-8")).hexdigest()[:10].upper()
    top_terms = ", ".join(metrics["commit_message_top_terms"][:5]) or "none"

    return f"""Analyze this GitHub behavioral dataset and return ONLY JSON.

username: {metrics['username']}
account_age_years: {metrics['account_age_years']}
total_stars: {metrics['total_stars']}
followers: {metrics['followers']}
public_repos: {metrics['public_repos']}
active_repos_30d: {metrics['active_repos_30d']}
active_repos_90d: {metrics['active_repos_90d']}
stale_repos_180d: {metrics['stale_repos_180d']}
archived_repo_count: {metrics['archived_repo_count']}
fork_repo_count: {metrics['fork_repo_count']}
language_diversity: {metrics['language_diversity']}
top_starred_repo: {metrics['top_starred_repo_name']} ({metrics['top_starred_repo_stars']} stars)
largest_repo: {metrics['largest_repo_name']} ({metrics['largest_repo_size_kb']} KB)
total_open_issues: {metrics['total_open_issues']}
top_3_languages_with_percentages: {top_langs}
average_commit_hour_utc: {avg_hour_display}
peak_commit_hour_utc: {metrics['peak_commit_hour']}
night_commit_ratio: {metrics['night_commit_ratio']}
business_hour_commit_ratio: {metrics['business_hour_commit_ratio']}
weekend_vs_weekday_commit_ratio: {ratio_display}
total_recent_commits_last_30_days: {metrics['recent_commits_30d']}
commit_message_lazy_ratio: {metrics['commit_message_lazy_ratio']}
commit_message_lexical_diversity: {metrics['commit_message_lexical_diversity']}
top_commit_terms: {top_terms}
profile_signature: {profile_signature}
last_10_commit_messages_raw:
{last_messages}

Important behavior constraints:
- Make this profile unique to the provided numbers and signature.
- Do NOT output generic reusable archetypes.
- Avoid repeating stock phrases like "Silent Builder" or "Asynchronous Builder" unless data strongly requires it.
- Every sentence must include at least one concrete metric from this payload.

Trait adjustment rules:
The traits have been pre-calculated from the raw data:
 creativity={base_traits['creativity']}, discipline={base_traits['discipline']},
 collaboration={base_traits['collaboration']}, boldness={base_traits['boldness']},
 depth={base_traits['depth']}, velocity={base_traits['velocity']}

You MAY adjust each trait by a maximum of +/-8 points based on qualitative signals in
the commit messages and bio. Do not change any trait by more than 8.
Your adjustments must be justified by the text data.
Return the adjusted values in the traits object.

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
    metrics = _extract_metrics(github_data)

    computed_base_traits = _calculate_base_traits(metrics, github_data)
    provided_base_traits = github_data.get("base_traits") if isinstance(github_data.get("base_traits"), dict) else {}
    base_traits = {
        trait: _clamp_int(_to_float(provided_base_traits.get(trait), computed_base_traits.get(trait, 50)) or computed_base_traits.get(trait, 50), 5, 100)
        for trait in ("creativity", "discipline", "collaboration", "boldness", "depth", "velocity")
    }

    fallback = _fallback_analysis(github_data, base_traits)
    if not _has_groq_key():
        return fallback

    try:
        username = str(metrics.get("username") or "")
        stars = _to_int(metrics.get("total_stars"), 0)
        repos = _to_int(metrics.get("public_repos"), 0)
        followers = _to_int(metrics.get("followers"), 0)
        account_age = _to_float(metrics.get("account_age_years"), 0.0) or 0.0

        metrics_top_langs = metrics.get("top_languages") if isinstance(metrics.get("top_languages"), list) else []
        top_langs: list[dict[str, Any]] = []
        for item in metrics_top_langs[:4]:
            if not isinstance(item, dict):
                continue
            lang = str(item.get("language") or item.get("lang") or "Unknown")
            pct = _to_float(item.get("percentage"), None)
            if pct is None:
                pct = _to_float(item.get("pct"), 0.0) or 0.0
            top_langs.append({"lang": lang, "pct": round(pct, 2)})

        avg_hour = _to_float(metrics.get("avg_commit_hour"), 14.0) or 14.0
        commit_msgs = metrics.get("last_commit_messages") if isinstance(metrics.get("last_commit_messages"), list) else []
        weekend_commits = _to_int(metrics.get("weekend_commits"), 0)
        weekday_commits = _to_int(metrics.get("weekday_commits"), 0)
        weekend_ratio = 0.2
        if weekend_commits + weekday_commits > 0:
            weekend_ratio = weekend_commits / (weekend_commits + weekday_commits)
        recent_commits = _to_int(metrics.get("recent_commits_30d"), 0)

        user_payload = github_data.get("user") if isinstance(github_data.get("user"), dict) else {}
        bio = str(user_payload.get("bio") or github_data.get("bio") or "")

        lang_str = ", ".join(f"{item['lang']}({item['pct']}%)" for item in top_langs[:4]) or "Unknown"
        if avg_hour < 5:
            hour_label = "deep night"
        elif avg_hour < 9:
            hour_label = "early morning"
        elif avg_hour < 17:
            hour_label = "daytime"
        elif avg_hour < 21:
            hour_label = "evening"
        else:
            hour_label = "night"

        commit_sample = "\n".join(str(message) for message in commit_msgs[:10]) or "No recent commits"
        primary_lang_ref = lang_str.split(",")[0].strip() if lang_str and lang_str != "Unknown" else "Unknown"

        structured_prompt = f"""Analyze this GitHub developer profile and return ONLY valid JSON.
No markdown, no backticks, no explanation.

DEVELOPER DATA:
Username: {username}
Account age: {account_age:.1f} years
Primary languages: {lang_str}
Total stars: {stars}
Followers: {followers}
Public repos: {repos}
Peak commit time: {int(round(avg_hour))}:00 UTC ({hour_label})
Weekend commit ratio: {weekend_ratio:.0%}
Recent commits (30 days): {recent_commits}
Bio: {bio or 'none'}

RECENT COMMIT MESSAGES (analyze writing style and working patterns):
{commit_sample}

PRE-CALCULATED TRAIT SCORES (adjust by max +/-8 only):
creativity={base_traits.get('creativity', 50)},
discipline={base_traits.get('discipline', 50)},
collaboration={base_traits.get('collaboration', 50)},
boldness={base_traits.get('boldness', 50)},
depth={base_traits.get('depth', 50)},
velocity={base_traits.get('velocity', 50)}

Return this EXACT JSON structure. Every string field must be
specific to this developer's actual data - never generic:
{{
  "devClass": "3-5 word creative RPG archetype title specific to their stack and patterns",
  "archetype": {{
    "name": "archetype name",
    "tier": "LEGENDARY|ELITE|VETERAN|RISING",
    "description": "2 sentences. Reference their specific numbers and patterns."
  }},
  "chronotype": {{
    "title": "creative name based on {int(round(avg_hour))}:00 UTC peak commit time",
    "description": "2 sentences connecting {hour_label} coding to their personality. Reference their {primary_lang_ref} work.",
    "workStyle": "3-word working style phrase"
  }},
  "collaborationStyle": {{
    "title": "archetype name based on {followers} followers and {weekend_ratio:.0%} weekend activity",
    "description": "2 sentences grounded in their follower count and commit patterns.",
    "score": integer between 20 and 85
  }},
  "traits": {{
    "creativity": integer,
    "discipline": integer,
    "collaboration": integer,
    "boldness": integer,
    "depth": integer,
    "velocity": integer
  }},
  "fastFacts": [
    "fact 1: reference {stars} stars or {repos} repos with a specific comparison or dark observation",
    "fact 2: reference the {int(round(avg_hour))}:00 UTC commit time specifically",
    "fact 3: reference {account_age:.1f} years or their top language specifically"
  ],
  "dnaSequence": "exactly 16 uppercase hex characters derived conceptually from their profile",
  "strengthReport": "1 sentence about their strongest capability. Use their actual top language.",
  "warningSign": "1 sentence about their most visible blindspot from the commit patterns."
}}"""

        raw = await call_groq(
            structured_prompt,
            SYSTEM_PROMPT,
            max_tokens=1300,
            temperature=0.45,
            model_candidates=GROQ_STRUCTURED_MODEL_CANDIDATES,
            timeout_seconds=GROQ_STRUCTURED_TIMEOUT_SECONDS,
        )
        cleaned = (raw or "").strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]

        parsed = _safe_json_parse(cleaned)
        if parsed is None:
            return fallback

        result = _normalize_result(parsed, fallback)
        for trait, base_value in base_traits.items():
            if trait in result.get("traits", {}):
                ai_value = _to_int(result["traits"].get(trait), base_value)
                result["traits"][trait] = max(base_value - 8, min(base_value + 8, ai_value))

        return result
    except Exception as exc:
        print(f"[GitDNA] Structured Groq analysis failed: {exc}")
        return fallback


class GroqAIEngine:
    """Compatibility wrapper used by the FastAPI app."""

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        if api_key:
            os.environ["GROQ_API_KEY"] = api_key
        self.model = model or GROQ_FAST_MODEL_NAME

    async def generate_profile_insights(self, github_data: dict[str, Any]) -> dict[str, Any]:
        return await analyze_developer(github_data)

    async def generate_battle_analysis(self, left_payload: dict[str, Any], right_payload: dict[str, Any]) -> str:
        return await analyze_battle(left_payload, right_payload)

    async def generate_roast_report(self, profile_payload: dict[str, Any]) -> dict[str, Any]:
        return await analyze_roast(profile_payload)

    async def generate_time_machine_narration(self, payload: dict[str, Any]) -> dict[str, Any]:
        return await analyze_time_machine_narration(payload)

    async def generate_gitmap_insight(self, payload: dict[str, Any]) -> str:
        return await analyze_gitmap_insight(payload)

    async def generate_commit_linguistics_insight(self, payload: dict[str, Any]) -> str:
        return await analyze_commit_linguistics_insight(payload)

    async def generate_newspaper_front_page(self, profile_payload: dict[str, Any]) -> dict[str, Any]:
        return await analyze_newspaper(profile_payload)
