import logging
import sys
from pydantic import BaseModel

class LogConfig(BaseModel):
    LOGGER_NAME: str = "eboe"
    LOG_FORMAT: str = "%(levelprefix)s | %(asctime)s | %(message)s"
    LOG_LEVEL: str = "DEBUG"

    version: int = 1
    disable_existing_loggers: bool = False
    formatters: dict = {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": LOG_FORMAT,
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    }
    handlers: dict = {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
    }
    loggers: dict = {
        "eboe": {"handlers": ["default"], "level": LOG_LEVEL},
    }

def setup_logging():
    import logging.config
    logging.config.dictConfig(LogConfig().model_dump())

logger = logging.getLogger("eboe")
