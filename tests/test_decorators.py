from pyrpc_server import default_router, rpc

def test_rpc_decorator_default_name():
    # Clear registry for clean test
    default_router._procedures.clear()
    
    @rpc
    def hello():
        return "world"
        
    assert "hello" in default_router.list()
    assert default_router.get("hello").fn == hello
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
    @rpc
    def my_documented_func():
        """This is a docstring."""
        return True
        
    assert my_documented_func.__name__ == "my_documented_func"
    assert my_documented_func.__doc__ == "This is a docstring."
