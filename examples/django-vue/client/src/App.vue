<script setup lang="ts">
import { ref } from "vue";
import { pyrpc } from "./pyrpc";

const name = ref("");

const { data: greeting, isPending: isLoadingGreeting } = pyrpc.greet.createQuery(() => ({ name: "Django User" }));
const { data: item } = pyrpc.read_item.createQuery(() => ({ item_id: 42, q: "django-test" }));
const createItem = pyrpc.create_item.createMutation();

const handleCreate = () => {
  if (name.value.trim()) {
    createItem.mutate({ 
      name: name.value, 
      description: `Created item: ${name.value}` 
    });
    name.value = "";
  }
};
</script>

<template>
  <div>
    <h1>pyRPC × Django × Vue</h1>
    <p>Full-stack type safety with Django backend and Vue frontend</p>
    
    <div class="card">
      <h3>Django Greeting</h3>
      <div v-if="isLoadingGreeting">Loading...</div>
      <pre v-else>{{ JSON.stringify(greeting, null, 2) }}</pre>
    </div>
    
    <div class="card">
      <h3>Item Query</h3>
      <pre>{{ JSON.stringify(item, null, 2) }}</pre>
    </div>
    
    <div class="card">
      <h3>Create Item</h3>
      <div style="display: flex; gap: 10px; align-items: center; justify-content: center;">
        <input
          v-model="name"
          type="text"
          placeholder="Item name"
          style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
        />
        <button
          @click="handleCreate"
          :disabled="createItem.isPending.value"
        >
          {{ createItem.isPending.value ? "Creating..." : "Create" }}
        </button>
      </div>
      <pre v-if="createItem.isSuccess.value">{{ JSON.stringify(createItem.data.value, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.card {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  text-align: left;
  overflow-x: auto;
}
</style>
