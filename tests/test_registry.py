from pyrpc.core.registry import ProcedureRegistry

def test_registry_register_get():
    registry = ProcedureRegistry()
    def my_fn(): return "hello"
    
    registry.register("hello", my_fn)
    assert registry.get("hello") == my_fn
    assert registry.get("unknown") is None

def test_registry_list():
    registry = ProcedureRegistry()
    registry.register("a", lambda: 1)
    registry.register("b", lambda: 2)
    
    names = registry.list()
    assert len(names) == 2
    assert "a" in names
    assert "b" in names

def test_registry_overwrite():
    registry = ProcedureRegistry()
    registry.register("test", lambda: 1)
    registry.register("test", lambda: 2)
    
    assert registry.get("test")() == 2
