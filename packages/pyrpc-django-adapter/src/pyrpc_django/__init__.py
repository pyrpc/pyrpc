from pyrpc_core import Router, default_router, handle_request, model, rpc

__all__ = ["mount_django", "rpc", "model", "Router", "default_router", "handle_request"]


def mount_django(urlpatterns: list, router: Router | None = None) -> None:
    import inspect
    import json

    from django.http import HttpRequest, JsonResponse
    from django.urls import path
    from django.views.decorators.csrf import csrf_exempt

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
