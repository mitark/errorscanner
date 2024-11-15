<script setup>
import axios from "axios";
import { computed, onMounted, ref } from "vue";
import DiskSpaces from "./components/DiskSpaces.vue";
import LogExpandables from "./components/LogExpandables.vue";
import TabBar from "./components/TabBar.vue";
import { logFiles, resetResults, results, servers, useErrorScanner } from "./useErrorScanner.js";

const Scanner = useErrorScanner();
const activeServerTab = ref(servers[0]);
const urlParams = new URLSearchParams(window.location.search);

const hasUrlParameters = computed(() => {
  return window.location.search.length > 0;
});

const updateTime = computed(() => {
  const time = results.currentTime;
  if (!time) {
    return "";
  } else if (urlParams.size > 0) {
    return new Date(time).toLocaleString("fi-FI", { timeZone: "Europe/Helsinki" });
  } else return time.toTimeString().substring(0, 8);
});

onMounted(async () => {
  if (urlParams.size == 0) {
    Scanner.startScan();
  } else {
    resetResults();
    await selectResults(urlParams);
  }
  if (servers.includes(window.location.hash.substring(1))) {
    activeServerTab.value = window.location.hash.substring(1);
  }
});

const activeTabErrors = computed(() => {
  const errors = results[activeServerTab.value]?.relevantErrorsObject;
  if (!errors) return "Fetching...";
  return Object.values(errors).flat().length;
});

async function selectResults(urlParams) {
  try {
    const response = await axios.post("/api/selectResults", {
      params: {
        Day: urlParams.get("Day"),
        Month: urlParams.get("Month"),
        Hour: urlParams.get("Hour"),
      },
    });
    console.log("Results selected: ", typeof response.data, response.data);
    Object.assign(results, response.data);
  } catch (error) {
    console.error("Failed to select results:", error);
  }
}
</script>

<template>
  <div class="main-container">
    <div class="sidebar">
      <div class="total-errors">
        <span class="total-left">
          <p class="error-count-subheading">Total errors</p>
          <p class="last-update">last updated {{ updateTime }}</p>
        </span>
        <p class="error-count">{{ results.totalErrorCount }}</p>
      </div>
      <TabBar v-model="activeServerTab" :servers="results.servers" :generate-refresh-button="!hasUrlParameters" />
    </div>
    <div class="logview-container">
      <DiskSpaces :serverName="activeServerTab" />
      <h4>{{ "Total errors in " + activeServerTab + ": " + activeTabErrors }}</h4>
      <div class="logs-container">
        <LogExpandables :serverName="activeServerTab" v-for="logFile in logFiles" :logName="logFile" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-container {
  display: grid;
  grid-template-columns: 1fr 6fr;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-image: var(--background-image);
  background-repeat: no-repeat;
  background-position: 0 0;
  background-size: cover;
}

.logview-container {
  height: 100%;
  background-color: var(--rightside-color);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1.5rem;
  overflow-y: scroll;
}

.total-errors {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px;
  display: flex;
  column-gap: 10px;
}

.total-left {
  display: flex;
  flex-direction: column;
}

.error-count {
  font-weight: 600;
  font-size: 3.5em;
  line-height: 1em;
}

.error-count-subheading {
  font-weight: 400;
  font-size: 1.6em;
}

.sidebar {
  background-color: var(--sidebar-color);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1.5rem;
  padding-right: 0rem;
}

.logs-container {
  display: flex;
  flex-direction: column;
  padding: 15px 0px;
}
</style>
