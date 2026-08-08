from flask import Flask
from flask_cors import CORS
from pyrpc_core import rpc
from pyrpc_flask import mount_flask

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])


@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"


@rpc.query
def greet(name: str = "World") -> dict:
    return {"message": f"Hello, {name}!", "framework": "Flask"}


@rpc.query
def read_item(item_id: int, q: str = None) -> dict:
    return {"item_id": item_id, "q": q, "framework": "Flask"}


@rpc.mutation
def create_item(name: str, description: str = None) -> dict:
    return {
        "name": name, 
        "description": description, 
        "created": True,
        "framework": "Flask"
    }


mount_flask(app)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
