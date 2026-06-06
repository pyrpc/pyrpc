from pyrpc_core import RpcRequest, RpcResponse
import json

def test_rpc_request_serialization():
    req = RpcRequest(id=1, method="add", params=[1, 2])
    data = req.model_dump()
    assert data == {"id": 1, "method": "add", "params": [1, 2]}
    
    # Test JSON string conversion
    json_str = req.model_dump_json()
    assert json.loads(json_str) == data

def test_rpc_request_optional_params():
    req = RpcRequest(id="abc", method="ping")
    assert req.params is None
    assert req.id == "abc"

def test_rpc_response_serialization():
    res = RpcResponse(id=1, result={"status": "ok"})
    data = res.model_dump()
    assert data == {"id": 1, "result": {"status": "ok"}, "error": None}

def test_rpc_response_error():
    res = RpcResponse(id=1, error={"code": 404, "message": "Procedure not found"})
    data = res.model_dump()
    assert data == {
        "id": 1,
        "result": None,
        "error": {"code": 404, "message": "Procedure not found", "data": None},
    }


def test_rpc_request_invalid():
    from pydantic import ValidationError
    import pytest
    
    with pytest.raises(ValidationError):
        # Missing method
        RpcRequest(id=1)
