import os
from collections import Counter
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException


class GitHubAnalyzer:
    """Fetches and computes profile telemetry using GitHub REST endpoints."""

    def __init__(self, github_token: str | None = None) -> None:
        token = (github_token or os.getenv("GITHUB_TOKEN", "")).strip()
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "GitDNA-FastAPI-Backend",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"

        self._client = httpx.AsyncClient(timeout=20.0, headers=headers)

    async def close(self) -> None:
        await self._client.aclose()

    async def _get_json(self, url: str, not_found_message: str) -> Any:
        try:
            response = await self._client.get(url)
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="GitHub API request failed.") from exc

        if response.status_code == 404:
            raise HTTPException(status_code=404, detail=not_found_message)
        if response.status_code in (403, 429):
            raise HTTPException(
                status_code=429,
                detail="GitHub API rate limit reached. Add a token or try again later.",
            )
        if response.status_code >= 400:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"GitHub API error: {response.text[:180]}",
            )

        return response.json()

    @staticmethod
    def _parse_iso_datetime(value: str | None) -> datetime | None:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
        except ValueError:
            return None

    @staticmethod
    def _extract_repositories(repo_payload: list[dict[str, Any]]) -> list[dict[str, Any]]:
        repos: list[dict[str, Any]] = []
        for repo in repo_payload:
            repos.append(
                {
                    "name": repo.get("name"),
                    "stars": repo.get("stargazers_count", 0),
                    "forks": repo.get("forks_count", 0),
                    "language": repo.get("language"),
                    "pushed_at": repo.get("pushed_at"),
                    "description": repo.get("description"),
                }
            )
        return repos

    @staticmethod
    def _extract_push_commits(events_payload: list[dict[str, Any]]) -> list[dict[str, str]]:
        commits: list[dict[str, str]] = []

        for event in events_payload:
            if event.get("type") != "PushEvent":
                continue

            created_at = event.get("created_at")
            payload = event.get("payload") or {}
            for commit in payload.get("commits") or []:
                raw_message = (commit.get("message") or "").strip()
                if not raw_message:
                    continue
                commits.append(
                    {
                        "message": raw_message.splitlines()[0][:160],
                        "timestamp": created_at or "",
                    }
                )

        return commits

    @staticmethod
    def _top_languages(repos: list[dict[str, Any]]) -> list[dict[str, Any]]:
        counts = Counter(repo["language"] for repo in repos if repo.get("language"))
        total = sum(counts.values())
        if total == 0:
            return []

        return [
            {
                "language": language,
                "count": count,
                "percentage": round((count / total) * 100, 2),
            }
            for language, count in counts.most_common(10)
        ]

    def _commit_time_metrics(self, commits: list[dict[str, str]]) -> dict[str, Any]:
        hour_distribution = [0] * 24
        weekend_commits = 0
        weekday_commits = 0
        hours: list[int] = []

        for commit in commits:
            dt = self._parse_iso_datetime(commit.get("timestamp"))
            if dt is None:
                continue

            hour_distribution[dt.hour] += 1
            hours.append(dt.hour)

            if dt.weekday() >= 5:
                weekend_commits += 1
            else:
                weekday_commits += 1

        avg_commit_hour = round(sum(hours) / len(hours), 2) if hours else None
        ratio = round(weekend_commits / weekday_commits, 3) if weekday_commits else None

        return {
            "avg_commit_hour": avg_commit_hour,
            "commit_hour_distribution": hour_distribution,
            "weekend_vs_weekday": {
                "weekend_commits": weekend_commits,
                "weekday_commits": weekday_commits,
                "ratio": ratio,
            },
        }

    async def analyze_profile(self, username: str) -> dict[str, Any]:
        clean_username = username.strip()
        if not clean_username:
            raise HTTPException(status_code=400, detail="Username is required.")

        user_url = f"https://api.github.com/users/{clean_username}"
        repos_url = (
            f"https://api.github.com/users/{clean_username}/repos"
            "?per_page=100&sort=pushed"
        )
        events_url = (
            f"https://api.github.com/users/{clean_username}/events/public"
            "?per_page=100"
        )

        user_payload = await self._get_json(user_url, "GitHub user not found.")
        repos_payload = await self._get_json(repos_url, "Unable to fetch repositories.")
        events_payload = await self._get_json(events_url, "Unable to fetch public events.")

        repos = self._extract_repositories(repos_payload if isinstance(repos_payload, list) else [])
        commits = self._extract_push_commits(events_payload if isinstance(events_payload, list) else [])

        total_stars = sum(repo.get("stars", 0) for repo in repos)
        top_languages = self._top_languages(repos)
        commit_metrics = self._commit_time_metrics(commits)

        return {
            "user": {
                "login": user_payload.get("login"),
                "name": user_payload.get("name"),
                "avatar_url": user_payload.get("avatar_url"),
                "bio": user_payload.get("bio"),
                "location": user_payload.get("location"),
                "blog": user_payload.get("blog"),
                "company": user_payload.get("company"),
                "followers": user_payload.get("followers", 0),
                "following": user_payload.get("following", 0),
                "public_repos": user_payload.get("public_repos", 0),
                "created_at": user_payload.get("created_at"),
                "updated_at": user_payload.get("updated_at"),
            },
            "repos": repos,
            "total_stars": total_stars,
            "top_languages": top_languages,
            "avg_commit_hour": commit_metrics["avg_commit_hour"],
            "commit_hour_distribution": commit_metrics["commit_hour_distribution"],
            "recent_commit_messages": [commit["message"] for commit in commits[:20]],
            "weekend_vs_weekday": commit_metrics["weekend_vs_weekday"],
        }
