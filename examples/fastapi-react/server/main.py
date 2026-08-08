from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pyrpc_core import rpc
from pyrpc_fastapi import mount_fastapi

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@rpc.query
def read_root():
    return {"Hello": "World"}


@rpc.query  
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}


@rpc.mutation
def create_item(name: str, description: str = None):
    return {"name": name, "description": description, "created": True}


mount_fastapi(app)
