import logging
import sys
import re

SENSITIVE_PATTERNS = [
    re.compile(r"mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@", re.IGNORECASE),
    re.compile(r"(api[_-]?key|secret|password|token)[\"']?\s*[:=]\s*[\"']?([^\"'\s&]+)", re.IGNORECASE),
]


class SanitizingFormatter(logging.Formatter):
    """Sanitizes connection strings, API keys, and passwords from log records."""

    def format(self, record: logging.LogRecord) -> str:
        msg = super().format(record)
        for pattern in SENSITIVE_PATTERNS:
            msg = pattern.sub(r"***REDACTED***", msg)
        return msg


def setup_logging(level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger("aether")
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = SanitizingFormatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s (%(module)s:%(lineno)d): %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    # Silence verbose 3rd party loggers
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("apscheduler").setLevel(logging.INFO)

    return logger


logger = setup_logging()
