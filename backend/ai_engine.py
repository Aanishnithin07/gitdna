import asyncio
import json
import os
from typing import Any

from groq import Groq


class GroqAIEngine:
    """Generates higher-level profile insights from extracted GitHub telemetry."""

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = (api_key or os.getenv("GROQ_API_KEY", "")).strip()
        self.model = model or os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    @staticmethod
    def _safe_json_parse(text: str) -> dict[str, Any] | None:
        cleaned = (text or "").replace("```json", "").replace("```", "").strip()
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

    @staticmethod
    def _fallback(github_data: dict[str, Any]) -> dict[str, Any]:
        user = github_data.get("user", {})
        top_languages = github_data.get("top_languages", [])
        best_lang = top_languages[0]["language"] if top_languages else "Unknown"

        ratio = github_data.get("weekend_vs_weekday", {}).get("ratio")
        if ratio is None:
            cadence = "balanced"
        elif ratio > 0.7:
            cadence = "weekend-heavy"
        elif ratio < 0.35:
            cadence = "weekday-focused"
        else:
            cadence = "mixed"

        return {
            "summary": (
                f"{user.get('login', 'This developer')} has strong momentum with "
                f"{github_data.get('total_stars', 0)} stars and {user.get('public_repos', 0)} public repos."
            ),
            "developer_archetype": "Systematic Builder",
            "strengths": [
                f"Primary language focus in {best_lang}",
                "Consistent repository output",
                "Visible public contribution footprint",
            ],
            "watchouts": [
                "Review commit message quality for maintainability",
                "Ensure healthy distribution of collaborative activities",
            ],
            "recommendations": [
                "Ship one polished flagship repository with clear README and roadmap",
                "Increase code review and issue participation for social proof",
                "Automate quality checks with CI for long-term velocity",
            ],
            "work_cadence": cadence,
        }

    def _request_insights(self, github_data: dict[str, Any]) -> dict[str, Any]:
        client = Groq(api_key=self.api_key)

        user = github_data.get("user", {})
        payload = {
            "username": user.get("login"),
            "name": user.get("name"),
            "total_stars": github_data.get("total_stars"),
            "public_repos": user.get("public_repos"),
            "top_languages": github_data.get("top_languages"),
            "avg_commit_hour": github_data.get("avg_commit_hour"),
            "weekend_vs_weekday": github_data.get("weekend_vs_weekday"),
            "recent_commit_messages": github_data.get("recent_commit_messages", [])[:8],
        }

        system_prompt = (
            "You are GitDNA Intelligence Engine. Return only valid JSON with keys: "
            "summary, developer_archetype, strengths, watchouts, recommendations, work_cadence. "
            "strengths/watchouts/recommendations must be arrays of short strings."
        )

        completion = client.chat.completions.create(
            model=self.model,
            temperature=0.6,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(payload)},
            ],
        )

        text = completion.choices[0].message.content if completion.choices else ""
        parsed = self._safe_json_parse(text)
        if parsed is None:
            return self._fallback(github_data)

        parsed.setdefault("summary", "No summary generated.")
        parsed.setdefault("developer_archetype", "Unclassified")
        parsed.setdefault("strengths", [])
        parsed.setdefault("watchouts", [])
        parsed.setdefault("recommendations", [])
        parsed.setdefault("work_cadence", "mixed")
        return parsed

    async def generate_profile_insights(self, github_data: dict[str, Any]) -> dict[str, Any]:
        if not self.api_key:
            return self._fallback(github_data)

        try:
            return await asyncio.to_thread(self._request_insights, github_data)
        except Exception:
            return self._fallback(github_data)
