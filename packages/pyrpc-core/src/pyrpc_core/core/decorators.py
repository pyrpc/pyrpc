from pydantic.dataclasses import dataclass as model

from .registry import Router

__all__ = ["default_router", "rpc", "model", "Router"]

# Global default router for easy use
default_router = Router()

# Alias the rpc decorator for the global router
rpc = default_router.rpc
