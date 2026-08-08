"use client";

import { api } from "@/lib/pyrpc";
import { useState } from "react";

export function Counter() {
  const [name, setName] = useState("");
  
  const { data: greeting, isLoading } = api.greet.useQuery({ name: "Django User" });
  const { data: item } = api.read_item.useQuery({ item_id: 42, q: "django-test" });
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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Django Greeting:</h3>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify(greeting, null, 2)}
          </pre>
        )}
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">Item Query:</h3>
        <pre className="bg-gray-100 p-2 rounded">
          {JSON.stringify(item, null, 2)}
        </pre>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">Create Item:</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            className="border rounded px-2 py-1"
          />
          <button
            onClick={handleCreate}
            disabled={createItem.isPending}
            className="bg-blue-500 text-white px-4 py-1 rounded disabled:opacity-50"
          >
            {createItem.isPending ? "Creating..." : "Create"}
          </button>
        </div>
        {createItem.isSuccess && (
          <pre className="bg-green-100 p-2 rounded mt-2">
            {JSON.stringify(createItem.data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
