<script setup>
import { results } from "@/useErrorScanner";
import { computed, ref } from "vue";

const props = defineProps({
  logEntry: { type: Object, required: true },
  serverName: { type: String, required: true },
  logName: { type: String, required: true },
});

const active = ref(false);
const logEntries = computed(() => {
  return results?.[props.serverName]?.relevantLogsObject?.[props.logName] || [];
});

const hasUrlParameters = computed(() => {
  return window.location.search.length > 0;
});

var secondLogName = "catalina.out";
if (props.logName === "catalina.out") {
  secondLogName = "prodoc.log";
}

const secondLogEntries = computed(() => {
  return results?.[props.serverName]?.relevantLogsObject?.[secondLogName] || [];
});

function getPreviousEntries() {
  let previousEntries = [];
  const index = logEntries?.value.findIndex(
    (entry) =>
      entry.day === props.logEntry.day &&
      entry.timestamp === props.logEntry.timestamp &&
      entry.title === props.logEntry.title
  );

  for (let i = 0; i < 50; i++) {
    // range(0, 50)
    let entry = logEntries?.value[index - 1 - i];
    if (entry) {
      previousEntries.push(entry);
    }
  }

  let previousEntriesText = "";
  for (const entry of previousEntries.reverse()) {
    previousEntriesText += hasUrlParameters.value
      ? `${entry?.day} ${new Date(entry?.timestamp)
          .toLocaleString("fi-FI", { timeZone: "Europe/Helsinki" })
          .substring(9)} ${entry?.title}\n ${entry?.stacktrace}`
      : `${entry?.day} ${entry?.timestamp.toTimeString().substring(0, 8)} ${entry?.title}\n ${entry?.stacktrace}`;
  }

  return previousEntriesText;
}

function getFollowingEntries() {
  let followingEntries = [];

  const index = logEntries?.value.findIndex(
    (entry) =>
      entry.day === props.logEntry.day &&
      entry.timestamp === props.logEntry.timestamp &&
      entry.title === props.logEntry.title
  );

  for (let i = 0; i < 50; i++) {
    // range(0, 50)
    let entry = logEntries.value[index + i];
    if (entry) {
      followingEntries.push(entry);
    }
  }

  let followingEntriesText = "";
  for (const entry of followingEntries) {
    followingEntriesText += hasUrlParameters.value
      ? `${entry?.day} ${new Date(entry?.timestamp)
          .toLocaleString("fi-FI", { timeZone: "Europe/Helsinki" })
          .substring(9)} ${entry?.title}\n ${entry?.stacktrace}`
      : `${entry?.day} ${entry?.timestamp.toTimeString().substring(0, 8)} ${entry?.title}\n ${entry?.stacktrace}`;
  }

  return followingEntriesText;
}

const errorMoment = computed(() => {
  return props.logEntry?.timestamp;
});

function getSecondLog() {
  var secondLog = [];
  for (const secondLogEntry of secondLogEntries.value) {
    if (Math.abs(secondLogEntry.timestamp - errorMoment.value) < 30 * 1000) {
      secondLog.push(
        hasUrlParameters.value
          ? `${secondLogEntry.day} ${new Date(secondLogEntry?.timestamp)
              .toLocaleString("fi-FI", { timeZone: "Europe/Helsinki" })
              .substring(9)} ${secondLogEntry.title}\n ${secondLogEntry.stacktrace}`
          : `${secondLogEntry.day} ${secondLogEntry.timestamp.toTimeString().substring(0, 8)} ${secondLogEntry.title}\n`
      );
    }
  }
  if (secondLog.length === 0) {
    return "Nothing happened in other log during this error (30 sec before or after)";
  } else {
    return secondLog.join("\n");
  }
}
</script>
<template>
  <div class="expandable-container" :class="{ active: active }">
    <div class="expandable-header" @click="active = !active">
      <p class="timestamp">
        {{
          hasUrlParameters
            ? `${logEntry.day} ${new Date(logEntry?.timestamp)
                .toLocaleString("fi-FI", { timeZone: "Europe/Helsinki" })
                .substring(9)}`
            : `${logEntry.day} ${logEntry.timestamp.toTimeString().substring(0, 8)}`
        }}
      </p>
      <p class="entry-title">{{ logEntry.title }}</p>
    </div>
    <div class="counter-container" @click="active = !active">
      <p class="duplicate-counter" v-if="logEntry.duplicateCounter">
        {{ logEntry.duplicateCounter }}
      </p>
    </div>
    <div class="content-row">
      <div class="column">
        <h4 v-if="active">Before:</h4>
        <p v-if="active" class="log-before-error">{{ getPreviousEntries() }}</p>
        <h4 v-if="active">After:</h4>
        <p v-if="active" class="log-after-error">{{ getFollowingEntries() }}</p>
      </div>
      <div class="column">
        <h4 v-if="active">In another log:</h4>
        <p v-if="active" class="in-another-log">{{ getSecondLog() }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.expandable-container {
  cursor: pointer;
  border: none;
  text-align: left;
  outline: none;
  font-size: 1em;
  padding: 5px;
  margin-bottom: 2px;
  background-color: var(--color-background-primary);
}

.expandable-header {
  padding: 10px;
  display: flex;
  gap: 5px;
}
.counter-container {
  padding: 5px;
  display: flex;
  gap: 5px;
}

.expandable-container:hover,
.counter-container:hover,
.active {
  background-color: var(--color-background-secondary);
}

.timestamp {
  font-weight: 400;
  font-size: 1.1em;
}

.entry-title {
  font-weight: 350;
}

.duplicate-counter {
  width: 25px;
  height: 25px;
  display: flex;
  margin-left: 20px;
  align-items: left;
  justify-content: center;
  font-weight: bold;
  font-size: 1em;
  color: var(--circle-text);
  background-color: var(--circle-background);
  border-radius: 50%;
  border-color: var(--circle-background);
}

.expandable-text {
  padding: 6px;
  padding-left: 90px;
  white-space: pre-line;
}

.content-row {
  display: flex;
  flex-wrap: wrap;
}

.column {
  flex: 1 1 48%;
  padding: 10px;
  box-sizing: border-box;
}

.log-before-error,
.log-after-error,
.in-another-log {
  font-weight: 300;
  white-space: pre-line;
}

@media (max-width: 768px) {
  .column {
    flex: 1 1 100%;
  }
}
</style>
