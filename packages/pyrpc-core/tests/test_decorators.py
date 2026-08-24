from pyrpc_core import default_router, rpc


def test_rpc_decorator_default_name():
    # Clear registry for clean test
    default_router._procedures.clear()
    
    @rpc
    def hello():
        return "world"
        
    assert "hello" in default_router.list()
    assert default_router.get("hello").fn == hello
    assert default_router.get("hello").kind == "query"
    assert hello() == "world"

def test_rpc_decorator_custom_name():
    # Clear registry for clean test
    default_router._procedures.clear()
    
    @rpc("custom_hello")
    def hello():
        return "world"
        
    assert "custom_hello" in default_router.list()
    assert "hello" not in default_router.list()
    assert default_router.get("custom_hello").fn == hello
    assert hello() == "world"

def test_rpc_decorator_preserves_metadata():
    default_router._procedures.clear()

    @rpc
    def my_documented_func():
        """This is a docstring."""
        return True
        
    assert my_documented_func.__name__ == "my_documented_func"
    assert my_documented_func.__doc__ == "This is a docstring."


def test_rpc_query_and_mutation_kinds():
    default_router._procedures.clear()

    @rpc.query
    def get_user(user_id: int) -> dict:
        return {"id": user_id}

    @rpc.mutation
    def update_user(user_id: int, name: str) -> dict:
        return {"id": user_id, "name": name}

    @rpc.query("fetch_status")
    def status() -> str:
        return "ok"

    assert default_router.get("get_user").kind == "query"
    assert default_router.get("update_user").kind == "mutation"
    assert default_router.get("fetch_status").kind == "query"
    assert default_router.get("fetch_status").fn == status
