import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logging.getLogger("startup_intelligence.providers").setLevel(logging.INFO)
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import get_client, close_client
from app.routers import health, auth, users, investor_profiles, companies, calls, memory, dashboard, follow_ups
from app.routers import startup_intelligence as si_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: warm the Motor connection pool
    get_client()
    yield
    # Shutdown: close cleanly
    await close_client()


app = FastAPI(
    title="Conviction API",
    description="Deal Continuity Copilot for Venture Capital",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else "/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(investor_profiles.router)
app.include_router(companies.router)
app.include_router(calls.router)
app.include_router(memory.router)
app.include_router(dashboard.router)
app.include_router(follow_ups.router)
app.include_router(si_router.router)
