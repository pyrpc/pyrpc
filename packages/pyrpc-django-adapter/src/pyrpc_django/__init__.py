from pyrpc_core import handle_request, Router, rpc, model, default_router
from typing import Any, Optional


def mount_django(urlpatterns: list, router: Optional[Router] = None) -> None:
    from django.http import HttpRequest, JsonResponse
    from django.urls import path
    from django.views.decorators.csrf import csrf_exempt
    import inspect
    import json

    resolved = router or default_router

    @csrf_exempt
    async def rpc_endpoint(request: HttpRequest) -> JsonResponse:
        if request.method != "POST":
            return JsonResponse({"error": "Method not allowed"}, status=405)
        try:
            body = await request.body if inspect.isawaitable(request.body) else request.body
            payload = json.loads(body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        response_dict = await handle_request(payload, router=resolved)
        return JsonResponse(response_dict)

    @csrf_exempt
    async def introspection_endpoint(request: HttpRequest) -> JsonResponse:
        if request.method != "GET":
            return JsonResponse({"error": "Method not allowed"}, status=405)
        from pyrpc_core import get_registry_schema
        schemas = get_registry_schema(resolved)
        return JsonResponse({
            name: schema.model_dump()
            for name, schema in schemas.items()
        })

    urlpatterns.extend([
        path("rpc", rpc_endpoint, name="pyrpc-rpc"),
        path("rpc", introspection_endpoint, name="pyrpc-introspection"),
    ])
