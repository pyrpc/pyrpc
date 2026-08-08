<script lang="ts">
  import { api } from "$lib/pyrpc";

  let name = "";
  
  const greeting = api.greet.createQuery(() => ({ name: "Django User" }));
  const item = api.read_item.createQuery(() => ({ item_id: 42, q: "django-test" }));
  const createItem = api.create_item.createMutation();

  function handleCreate() {
    if (name.trim()) {
      $createItem.mutate({ 
        name, 
        description: `Created item: ${name}` 
      });
      name = "";
    }
  }
</script>

<svelte:head>
  <title>pyRPC FastAPI Svelte App</title>
  <meta name="description" content="FastAPI + Svelte with pyRPC" />
</svelte:head>

<main>
  <h1>pyRPC × Django × Svelte</h1>
  <p>Full-stack type safety with Django backend and Svelte frontend</p>
  
  <section class="card">
    <h3>Django Greeting</h3>
    {#if $greeting.isPending}
      <p>Loading...</p>
    {:else}
      <pre>{JSON.stringify($greeting.data, null, 2)}</pre>
    {/if}
  </section>
  
  <section class="card">
    <h3>Item Query</h3>
    <pre>{JSON.stringify($item.data, null, 2)}</pre>
  </section>
  
  <section class="card">
    <h3>Create Item</h3>
    <div class="form-group">
      <input
        bind:value={name}
        type="text"
        placeholder="Item name"
      />
      <button
        on:click={handleCreate}
        disabled={$createItem.isPending}
      >
        {$createItem.isPending ? "Creating..." : "Create"}
      </button>
    </div>
    {#if $createItem.isSuccess}
      <pre>{JSON.stringify($createItem.data, null, 2)}</pre>
    {/if}
  </section>
</main>

<style>
  main {
    text-align: center;
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  .card {
    margin: 20px 0;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    text-align: left;
  }

  .form-group {
    display: flex;
    gap: 10px;
    align-items: center;
    margin: 10px 0;
  }

  .form-group input {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    flex: 1;
  }

  .form-group button {
    padding: 8px 16px;
    background-color: #ff3e00;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .form-group button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  pre {
    background-color: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
  }
</style>
