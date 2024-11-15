<script setup>
import { computed } from "vue";
import { results } from "../useErrorScanner.js";
import ExpandableEntry from "./ExpandableEntry.vue";

const props = defineProps({
  serverName: {
    type: String,
    required: true,
  },
  logName: {
    type: String,
    required: true,
  },
});

const errors = computed(() => results?.[props.serverName]?.relevantErrorsObject?.[props.logName]);
</script>

<template>
  <div class="error-text-expandables" v-if="errors?.length">
    <h5>{{ logName }}</h5>
    <ExpandableEntry
      v-for="error in errors.slice().reverse() /*slice() to create a copy from arr instead of modifying it*/"
      :logEntry="error"
      :serverName="props.serverName"
      :logName="props.logName"
    />
  </div>
</template>

<style scoped>
.error-text-expandables {
  display: flex;
  flex-direction: column;
}
</style>
