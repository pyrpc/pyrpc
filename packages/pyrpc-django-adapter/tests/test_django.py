import json

import anyio
import pytest
from pyrpc_core import default_router, rpc


@pytest.fixture(autouse=True)
def clear_registry():
    default_router._procedures.clear()


def test_django_mount_success():
    from django.test import RequestFactory
    from pyrpc_django import mount_django

    @rpc
    def greet(name: str) -> str:
        return f"Hello {name}"

    urlpatterns = []
    mount_django(urlpatterns)

    factory = RequestFactory()
    payload = {"id": "d-1", "method": "greet", "params": {"name": "Django"}}
    request = factory.post("/rpc", json.dumps(payload), content_type="application/json")

    async def run():
        response = await urlpatterns[0].callback(request)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data["id"] == "d-1"
        assert data["result"] == "Hello Django"
        assert data["error"] is None

    anyio.run(run)


def test_django_async_procedure():
    from django.test import RequestFactory
    from pyrpc_django import mount_django

    @rpc
    async def async_greet(name: str) -> str:
        return f"Async Hello {name}"

    urlpatterns = []
    mount_django(urlpatterns)

    factory = RequestFactory()
    payload = {"id": "d-2", "method": "async_greet", "params": {"name": "World"}}
    request = factory.post("/rpc", json.dumps(payload), content_type="application/json")

    async def run():
        response = await urlpatterns[0].callback(request)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data["result"] == "Async Hello World"

    anyio.run(run)


def test_django_introspection():
    from django.test import RequestFactory
    from pyrpc_django import mount_django

    @rpc
    def add(a: int, b: int) -> int:
        return a + b

    urlpatterns = []
    mount_django(urlpatterns)

    factory = RequestFactory()
    request = factory.get("/rpc")

    async def run():
        response = await urlpatterns[1].callback(request)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert "add" in data

    anyio.run(run)
