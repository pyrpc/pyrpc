import React, { useState } from "react";
import "./App.css";
import { api } from "./pyrpc";

function App() {
  const [name, setName] = useState("");
  
  const { data: greeting, isLoading } = api.read_root.useQuery();
  const { data: item } = api.read_item.useQuery({ item_id: 42, q: "test" });
  const createItem = api.create_item.useMutation();

  const handleCreate = () => {
    if (name.trim()) {
      createItem.mutate({ 
        name, 
        description: `Created item: ${name}` 
      });
      setName("");
    }
  };

  return (
    <api.Provider>
      <div className="App">
        <header className="App-header">
          <h1>pyRPC × FastAPI × React</h1>
          <p>Full-stack type safety with FastAPI backend and React frontend</p>
        </header>
        
        <div className="container">
          <div className="section">
            <h3>API Response</h3>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <pre>{JSON.stringify(greeting, null, 2)}</pre>
            )}
          </div>
          
          <div className="section">
            <h3>Item Query</h3>
            <pre>{JSON.stringify(item, null, 2)}</pre>
          </div>
          
          <div className="section">
            <h3>Create Item</h3>
            <div className="form-group">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Item name"
              />
              <button
                onClick={handleCreate}
                disabled={createItem.isPending}
              >
                {createItem.isPending ? "Creating..." : "Create"}
              </button>
            </div>
            {createItem.isSuccess && (
              <pre>{JSON.stringify(createItem.data, null, 2)}</pre>
            )}
          </div>
        </div>
      </div>
    </api.Provider>
  );
}

export default App;
