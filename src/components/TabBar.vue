<script setup>
import { computed, defineModel, ref } from "vue";
import { results, useErrorScanner } from "../useErrorScanner.js";

const active = defineModel();
const Scanner = useErrorScanner();
const autoRefresh = ref(false); // State for the auto-refresh checkbox
let intervalId = null; // Variable to store the interval ID

const props = defineProps({
  servers: { type: Array, required: false },
  generateRefreshButton: { type: Boolean, required: true },
});

function switchServerTab(server) {
  active.value = server;
}

const activeIndex = computed(() => props.servers?.indexOf(active.value));

const activeIndicatorStyle = computed(() => {
  const height = 100 / props.servers?.length;
  return { height: `${height}%`, top: `${height * activeIndex.value}%` };
});

function formErrorCount(server) {
  const errors = results?.[server]?.relevantErrorsObject;
  if (!errors) return "...";
  if (Object.values(errors).flat().length > 0) {
    return Object.values(errors).flat().length;
  } else return "OK";
}

// Function to handle auto-refresh toggle
function toggleAutoRefresh() {
  if (autoRefresh.value) {
    intervalId = Scanner.startAutoRefresh();
  } else {
    clearInterval(intervalId);
    intervalId = null;
  }
}
</script>

<template>
  <div class="tab-bar">
    <div
      class="server-tab"
      :class="{ active: server == active }"
      v-for="server in props.servers"
      @click="switchServerTab(server)"
    >
      <p>{{ server }}</p>
      <p>
        {{ formErrorCount(server) }}
      </p>
    </div>
    <div :style="activeIndicatorStyle" class="active-indicator"></div>
  </div>
  <div v-if="props.generateRefreshButton" class="auto-refresh-container">
    <input type="checkbox" id="auto-refresh" v-model="autoRefresh" @change="toggleAutoRefresh" />
    <label for="auto-refresh">Auto-refresh</label>
  </div>
</template>

<style scoped>
.tab-bar {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: var(--standard-radius);
  position: relative;
  overflow: visible;
  padding-right: 0rem;
}

.server-tab {
  display: flex;
  justify-content: space-between;
  float: left;
  border: none;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  text-align: center;
  font-weight: 300;
  font-size: 15px;
  padding: 13px 20px;
  z-index: 1;
}

.server-tab:hover:not(.active) {
  background-color: var(--rightside-color);
}

p {
  font-weight: 400;
}

.active {
  font-weight: 500;
}

.active-indicator {
  transition: all 0.3s ease;
  background-color: var(--rightside-color);
  width: 100%;

  position: absolute;
}

.auto-refresh-container {
  margin-top: 30px;
}
</style>
