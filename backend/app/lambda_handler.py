"""
AWS Lambda entry point.

Mangum translates the Lambda (event, context) invocation into an ASGI request
that FastAPI can handle, then converts the ASGI response back into the shape
that API Gateway (REST v1 or HTTP v2) expects.

The existing `app` object in main.py — including all middleware, routers, and
the lifespan context manager — is used without any modification.

Usage (Lambda handler path):  app.lambda_handler.handler
"""
from mangum import Mangum
from app.main import app  # noqa: F401 — imports the fully-configured FastAPI app

# lifespan="on" ensures the asynccontextmanager in main.py is respected:
#   startup  → get_client() warms the Motor connection pool
#   shutdown → close_client() closes cleanly
handler = Mangum(app, lifespan="on")
