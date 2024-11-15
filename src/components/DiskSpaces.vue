<script setup>
import { computed } from "vue";
import { results } from "../useErrorScanner.js";

const props = defineProps({
  serverName: {
    type: String,
    required: true,
  },
});

const disks = computed(() => results?.[props.serverName]?.diskSpace);
</script>

<template>
  <div class="full-container">
    <h4>Disk spaces used</h4>
    <div class="spaces-container">
      <div class="disk-space" v-for="disk in disks">
        {{ disk }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.disk-space {
  font-weight: 300;
  font-size: 1.3em;

  padding: 20px 20px;
}

.spaces-container {
  display: flex;
  width: 100%;
  gap: 3rem;
}

h4 {
  margin: 0;
}

.full-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 0px;
}
</style>
