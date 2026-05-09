from pyrpc_server.core.registry import Router
from pyrpc_server.core.procedure import Procedure

def test_registry_register_get():
    router = Router()
    def my_fn(): return "hello"
    
    proc = Procedure(my_fn)
    router.register("hello", proc)
    assert router.get("hello") == proc
    assert router.get("unknown") is None

def test_registry_list():
    router = Router()
    router.register("a", Procedure(lambda: 1))
    router.register("b", Procedure(lambda: 2))
    
    names = router.list()
    assert len(names) == 2
    assert "a" in names
    assert "b" in names

def test_registry_overwrite():
    router = Router()
    router.register("test", Procedure(lambda: 1))
    router.register("test", Procedure(lambda: 2))
    
    assert router.get("test").fn() == 2
