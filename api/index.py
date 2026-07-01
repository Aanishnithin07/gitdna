"""Vercel serverless entrypoint.

Runs the EXISTING FastAPI backend (backend/main.py) unchanged as a single
serverless function. Vercel's Python runtime detects the module-level ASGI
`app` object and serves it. All routes (/api/*, /health) are handled here.

The real backend code stays in backend/ as the single source of truth; this
file only puts it on the import path and re-exports its `app`.
"""

import os
import sys

# Make the sibling backend/ package importable (main.py does `from ai_engine ...`).
_BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "backend")
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from main import app  # noqa: E402  (import after sys.path setup)

# `app` is the ASGI application Vercel will serve.
__all__ = ["app"]
