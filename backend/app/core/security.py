from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader
from backend.app.core.config import settings
from backend.app.core.logging import logger

API_KEY_HEADER = APIKeyHeader(name="X-Admin-API-Key", auto_error=False)


async def verify_admin_api_key(api_key: str = Security(API_KEY_HEADER)) -> bool:
    """Validates the administrative API key for protected operations."""
    if not settings.ADMIN_API_KEY:
        return True

    if not api_key or api_key != settings.ADMIN_API_KEY:
        logger.warning("Unauthorized access attempt to admin endpoint")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Admin-API-Key header",
        )
    return True
