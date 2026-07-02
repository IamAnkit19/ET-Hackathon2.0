import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "VYUH Digital Public Safety Platform"
    API_V1_STR: str = "/api"
    
    # DB Configuration with automatic SQLite fallback
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./vyuh.db")
    
    # Graph DB configuration with fallback flag
    USE_NEO4J: bool = os.getenv("USE_NEO4J", "False").lower() in ("true", "1")
    NEO4J_URI: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "password")
    
    # LLM configurations (Groq / Gemini)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # WebSockets configuration
    WS_HEARTBEAT_INTERVAL: int = 10
    
    class Config:
        case_sensitive = True

settings = Settings()
