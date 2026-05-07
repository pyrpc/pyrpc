from pyrpc_server import default_registry, rpc

def test_rpc_decorator_default_name():
    # Clear registry for clean test
    default_registry._procedures.clear()
    
    @rpc
    def hello():
        return "world"
        
    assert "hello" in default_registry.list()
    assert default_registry.get("hello") == hello
    assert hello() == "world"

def test_rpc_decorator_custom_name():
    # Clear registry for clean test
    default_registry._procedures.clear()
    
    @rpc(name="custom_hello")
    def hello():
        return "world"
        
    assert "custom_hello" in default_registry.list()
    assert "hello" not in default_registry.list()
    assert default_registry.get("custom_hello") == hello
    assert hello() == "world"

def test_rpc_decorator_preserves_metadata():
    @rpc
    def my_documented_func():
        """This is a docstring."""
        return True
        
    assert my_documented_func.__name__ == "my_documented_func"
    assert my_documented_func.__doc__ == "This is a docstring."
