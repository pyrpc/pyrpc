import asyncio
from pyrpc_server import RPCClient, RPCError

def run_sync_example():
    print("--- Running Synchronous Client Example ---")
    with RPCClient("http://localhost:8000") as client:
        try:
            # Simple add
            res = client.add(10, 5)
            print(f"10 + 5 = {res}")

            # Greet with default
            print(client.greet())

            # Greet with parameter
            print(client.greet(name="pyRPC User"))

        except RPCError as e:
            print(f"Caught RPC Error: {e.code} - {e.message}")

async def run_async_example():
    print("\n--- Running Asynchronous Client Example ---")
    async with RPCClient("http://localhost:8000") as client:
        try:
            # Call async procedure
            status = await client.get_status.aio()
            print(f"Server Status: {status}")

            # Call sync procedure asynchronously
            res = await client.add.aio(a=1, b=2)
            print(f"Async 1 + 2 = {res}")

        except RPCError as e:
            print(f"Caught RPC Error: {e.code} - {e.message}")

if __name__ == "__main__":
    # Note: Requires the server in basic_server.py to be running!
    try:
        run_sync_example()
        asyncio.run(run_async_example())
    except Exception as e:
        print(f"\nCould not connect to server: {e}")
        print("Make sure basic_server.py is running first!")
