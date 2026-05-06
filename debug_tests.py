import sys
import os

# Ensure src is in the path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from pyrpc import default_registry, rpc

def debug_decorator():
    print("Testing @rpc decorator...")
    try:
        @rpc
        def hello():
            return "world"
        
        print(f"Registry list: {default_registry.list()}")
        assert "hello" in default_registry.list()
        assert default_registry.get("hello") == hello
        print("Test 1 passed!")
        
        @rpc(name="custom_hello")
        def hello2():
            return "world"
            
        print(f"Registry list: {default_registry.list()}")
        assert "custom_hello" in default_registry.list()
        print("Test 2 passed!")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_decorator()
