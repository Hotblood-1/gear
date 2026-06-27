"""
Vercel Serverless Handler for FastAPI
This file allows the FastAPI app to run on Vercel serverless functions.
"""

import sys
from pathlib import Path

# Add backend to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from server import app

# Export the FastAPI app for Vercel
export = app