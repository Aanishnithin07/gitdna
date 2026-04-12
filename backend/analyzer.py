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
                    "archived": bool(repo.get("archived", False)),
                    "is_fork": bool(repo.get("fork", False)),
                    "open_issues_count": repo.get("open_issues_count", 0),
                    "watchers_count": repo.get("watchers_count", 0),
                    "size_kb": repo.get("size", 0),
                    "topics": repo.get("topics", []) if isinstance(repo.get("topics"), list) else [],
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
        total_commits = len(hours)
        night_commits = sum(1 for hour in hours if hour < 6)
        business_hour_commits = sum(1 for hour in hours if 9 <= hour <= 18)
        peak_commit_hour = max(range(24), key=lambda index: hour_distribution[index]) if total_commits > 0 else None

        return {
            "avg_commit_hour": avg_commit_hour,
            "commit_hour_distribution": hour_distribution,
            "night_commit_ratio": round(night_commits / total_commits, 3) if total_commits else 0.0,
            "business_hour_commit_ratio": round(business_hour_commits / total_commits, 3) if total_commits else 0.0,
            "peak_commit_hour": peak_commit_hour,
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

        now = datetime.now(timezone.utc)
        active_repos_30d = 0
        active_repos_90d = 0
        stale_repos_180d = 0
        archived_repo_count = 0
        fork_repo_count = 0
        total_repo_size_kb = 0
        total_open_issues = 0

        for repo in repos:
            if repo.get("archived"):
                archived_repo_count += 1
            if repo.get("is_fork"):
                fork_repo_count += 1
            total_repo_size_kb += int(repo.get("size_kb", 0) or 0)
            total_open_issues += int(repo.get("open_issues_count", 0) or 0)

            pushed_at = self._parse_iso_datetime(repo.get("pushed_at"))
            if pushed_at is None:
                continue
            days_since_push = (now - pushed_at).total_seconds() / (60 * 60 * 24)
            if days_since_push <= 30:
                active_repos_30d += 1
            if days_since_push <= 90:
                active_repos_90d += 1
            if days_since_push > 180:
                stale_repos_180d += 1

        top_starred_repo = max(repos, key=lambda repo: repo.get("stars", 0), default=None)
        largest_repo = max(repos, key=lambda repo: repo.get("size_kb", 0), default=None)
        language_diversity = len({repo.get("language") for repo in repos if repo.get("language")})
        avg_repo_size_kb = round(total_repo_size_kb / max(len(repos), 1), 2) if repos else 0.0

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
            "recent_commit_timestamps": [commit["timestamp"] for commit in commits if commit.get("timestamp")],
            "night_commit_ratio": commit_metrics["night_commit_ratio"],
            "business_hour_commit_ratio": commit_metrics["business_hour_commit_ratio"],
            "peak_commit_hour": commit_metrics["peak_commit_hour"],
            "weekend_vs_weekday": commit_metrics["weekend_vs_weekday"],
            "active_repos_30d": active_repos_30d,
            "active_repos_90d": active_repos_90d,
            "stale_repos_180d": stale_repos_180d,
            "archived_repo_count": archived_repo_count,
            "fork_repo_count": fork_repo_count,
            "language_diversity": language_diversity,
            "total_repo_size_kb": total_repo_size_kb,
            "avg_repo_size_kb": avg_repo_size_kb,
            "total_open_issues": total_open_issues,
            "top_starred_repo": {
                "name": top_starred_repo.get("name") if top_starred_repo else None,
                "stars": top_starred_repo.get("stars", 0) if top_starred_repo else 0,
            },
            "largest_repo": {
                "name": largest_repo.get("name") if largest_repo else None,
                "size_kb": largest_repo.get("size_kb", 0) if largest_repo else 0,
            },
        }
