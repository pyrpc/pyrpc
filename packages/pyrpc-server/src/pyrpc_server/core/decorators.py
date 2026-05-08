from .registry import Router

# Global default router for easy use
default_router = Router()

# Alias the rpc decorator for the global router
rpc = default_router.rpc
