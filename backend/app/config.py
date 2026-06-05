from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


def _strip_env_quotes(v: object) -> object:
    if isinstance(v, str):
        return v.strip().strip('"').strip("'")
    return v


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "conviction"

    # Auth
    google_client_id: str = ""
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 168

    # CORS — comma-separated in .env, e.g. http://localhost:5173,http://127.0.0.1:5173
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Startup Intelligence providers (all optional — fallback mode works without them)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"  # grounding research
    gemini_synthesis_model: str = "gemini-2.5-flash-lite"  # report synthesis (more reliable)
    tavily_api_key: str = ""
    firecrawl_api_key: str = ""

    # Open-source LLM via Hugging Face (company data extraction)
    huggingface_api_key: str = ""
    huggingface_model: str = "Qwen/Qwen2.5-7B-Instruct"
    huggingface_max_tokens: int = 4096

    # Google Search grounding for Gemini — enables live web research (founders, funding, news)
    gemini_grounding_enabled: bool = True

    @field_validator(
        "gemini_api_key",
        "huggingface_api_key",
        "tavily_api_key",
        "firecrawl_api_key",
        mode="before",
    )
    @classmethod
    def strip_api_key_quotes(cls, v: object) -> object:
        return _strip_env_quotes(v)

    # Search: always run founder query, cap at 3 queries max
    tavily_max_queries: int = 3
    firecrawl_fallback_only: bool = True

    # Dev
    dev_mock_auth: bool = True
    debug: bool = False

    @property
    def cors_origin_list(self) -> List[str]:
        cleaned = self.cors_origins.strip().strip("[]")
        return [
            origin.strip().strip('"').strip("'")
            for origin in cleaned.split(",")
            if origin.strip()
        ]


settings = Settings()
