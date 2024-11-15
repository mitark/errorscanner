import axios from "axios";
import { reactive } from "vue";
import { sendToSlack } from "./useSlackChannel.js";
import { hourAlmostOver } from "./utils.js";

/**
 * The result object of a specific server is shaped like:
 * @typedef {Object} ResultObject
 * @property {String} diskSpace - Indicates the disk space left on the server
 * @property {Object<logFile, LogEntry[]>} relevantErrorsObject - Contains kerrors grouped by log file name
 * @property {Object<logFile, LogEntry[]>} relevantLogsObject - Contains logs grouped by log file name
 * @property {String} serverErrorText - Contains text to be displayed
 */

/**
 * @typedef {Object} LogEntry
 * @property {String} day - Day of the log entry
 * @property {Date} timestamp - Timestamp of the log entry
 * @property {String} title - Title of the log entry
 * @property {String} stacktrace - Stacktrace of the log entry (empty if no stacktrace)
 */

export const results = reactive({
  totalErrorCount: 0,
});

export const servers = ["jateasemat", "stara", "tls" /*"west"*/ /*"espoo",*/];
export const logFiles = ["jprodoc.log", "prodoc.log", "catalina.out"];

export const resetResults = () => {
  Object.keys(results).forEach((key) => {
    delete results[key];
  });
  results.totalErrorCount = 0;
};

export function useErrorScanner() {
  function startScan() {
    scanData();
  }

  function startAutoRefresh() {
    scanData();
    return setInterval(scanData, 5 * 60 * 1000); // Skannaa 5 minuutin välein
  }
  function scanData() {
    resetResults();
    results["servers"] = servers;
    results["currentTime"] = new Date();

    let promises = [];

    for (const server of servers) {
      const promise = scanServer(server).then((res) => {
        results[server] = res;
      });
      promises.push(promise);
    }

    Promise.all(promises).then(() => {
      console.log("FINISHED");
      if (hourAlmostOver()) saveResults();
      sendToSlack();
    });
  }

  async function scanServer(server) {
    let serverUrl = `https://${server}.protieto.com/secretkey`;
    if (server === "jateasemat") {
      serverUrl = `https://${server}.fi/juuri/secretkey`; 
    }

    let connectionAttempts = 0;
    let response;
    while (connectionAttempts < 3) {
      try {
        response = await fetch(serverUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        response = await response.json();

        break;
      } catch (err) {
        connectionAttempts++;
        console.log(`Connection attempt ${connectionAttempts} of 3`);
        if (connectionAttempts === 3) {
          const res = {
            diskSpace: ["Cannot reach server"],
            serverErrorText: "Cannot reach server",
            connectionSuccess: false,
          };

          console.error(`Error fetching data from ${server}:`, err);
          return res;
        }
      }
    }

    const diskSpace = makeDiskString(handleDiskSpace(response));
    const [relevantErrorsObject, relevantLogsObject] = await formLogsToEntries(response, server);
    const errors = Object.values(relevantErrorsObject).flat();
    results.totalErrorCount += errors.length;

    const res = {
      diskSpace: diskSpace,
      relevantLogsObject: relevantLogsObject,
      relevantErrorsObject: relevantErrorsObject,
      connectionSuccess: true,
    };

    return res;
  }

  function makeDiskString(relevantDisks) {
    if (Object.entries(relevantDisks).length === 0) {
      return ["No disks found"];
    } else {
      let disks = [];
      Object.entries(relevantDisks).forEach(([diskName, percentage]) => {
        if (
          !diskName.includes("loop") &&
          !diskName.includes("tmpfs") &&
          !diskName.includes("udev") &&
          !diskName.includes("remote")
        ) {
          disks.push(`${diskName}: ${percentage.toFixed(2)}%`);
        }
      });
      return disks;
    }
  }

  // Function to handle disk space data from server response
  function handleDiskSpace(jsonResponse) {
    let relevantDisks = {};
    Object.entries(jsonResponse).forEach(([itemName, item]) => {
      if (itemName === "disk_space_left") {
        Object.entries(item).forEach(([diskName, diskSpaces]) => {
          if (Object.values(diskSpaces)[1] >= 10 * 1000 * 1000) {
            // diskSpaces is an object in which the first value is the free space and the second value is the total space
            let diskSpaceStatus =
              100 * (1 - Number(Object.values(diskSpaces)[0]) / Number(Object.values(diskSpaces)[1]));
            relevantDisks[diskName] = diskSpaceStatus;
          }
        });
      }
    });
    return relevantDisks;
  }

  async function formLogsToEntries(allResponse, server) {
    const regex = /\d{2}:\d{2}:\d{2}/;
    const catalinaResponse = await getCatalinaResponse(server);
    var response = { ...allResponse, ...catalinaResponse };
    if (!regex.test(catalinaResponse["catalina.out"].split("\n")[0])) {
      response = allResponse;
      console.log("No catalina.out for " + server);
    }

    const relevantLogsObject = {};
    const relevantErrorsObject = {};

    for (const [key, value] of Object.entries(response)) {
      if (typeof value !== "string" || !value.includes("\n")) continue;

      const lines = value.split("\n");
      const logEntries = [];

      for (const line of lines) {
        if (line == "") continue;
        if (regex.test(line) && (key != "catalina.out" || (key == "catalina.out" && !beginsWithAt(line)))) {
          // make new log entries for main lines (other than stacktraces). first if handles prodoc and jprodoc, second if handles catalina.out
          logEntries.push(makeLogEntry(line));
        }
        // handle stacktraces by adding them to the last log entry
        else {
          const lastEntry = logEntries.at(-1);
          if (!lastEntry) continue;
          lastEntry.stacktrace += line.slice(line.indexOf("at ")).trim() + "\n";
        }
      }
      relevantLogsObject[key] = logEntries;
      relevantErrorsObject[key] = getRelevantErrors(key, ignoreUnwantedErrors(logEntries, server));
    }
    return [relevantErrorsObject, relevantLogsObject];
  }

  async function getCatalinaResponse(server) {
    const filePath = `./catalina.out_${server}`;
    const response = await fetch(filePath);
    const content = await response.text();
    return { "catalina.out": content };
  }

  function beginsWithAt(line) {
    const substring = line.substring(line.indexOf("]:") + 2).trim();
    const wordsInString = substring.split(" ");
    return wordsInString[0] === "at";
  }

  function makeLogEntry(line) {
    const regex = /\d{2}:\d{2}:\d{2}/;
    const regexProdoc = /^[A-Za-z]{3} \d{2}:\d{2}:\d{2}\.\d{3}/;
    const regexCatalina = /^[A-Za-z]{3} \d{2} \d{2}:\d{2}:\d{2}/;
    const match = line.match(regex);

    const timestamp = new Date(`2024-05-01T${match[0]}`); // korjattava kohta (timezone)
    if (isNaN(timestamp)) throw new Error(`Invalid timestamp: ${timestamp} for line ${line}`, match);

    const messageStartindex = match.index + match[0].length;
    const message = line.slice(messageStartindex);

    var day = "";
    if (regexProdoc.test(line)) day = line.slice(0, 3);
    else if (regexCatalina.test(line)) day = line.slice(0, 6);

    const logEntry = {
      day: day,
      timestamp: timestamp,
      title: message,
      stacktrace: "",
    };

    return logEntry;
  }

  function ignoreUnwantedErrors(logEntries, server) {
    let finalErrors = logEntries.filter(
      (entry) => !entry.title.includes("ClientAbortException") && !entry.title.includes("WriteAbortedException")
    );
    if (
      server === "toimisto" ||
      server === "staratesti" ||
      server === "staratesti2" ||
      server === "espootesti" ||
      server === "espootesti2"
    ) {
      return finalErrors.filter((entry) => !entry.title.includes("MailSender")); // testipalvelimilta ei kuulua pystyä lähettämään sähköposteja
    }
    return finalErrors;
  }

  function getRelevantErrors(key, logEntries) {
    let errors = [];

    if (key == "catalina.out") {
      errors = logEntries.filter(
        (entry) =>
          entry.title.includes("ERROR") ||
          entry.title.includes("SEVERE") ||
          entry.title.includes("FATAL") ||
          entry.title.includes("Exception")
      );
    } else {
      errors = logEntries.filter((entry) => entry.title.includes("ERROR"));
    }

    const errorsWithoutDuplicates = removeDuplicates(errors);

    return errorsWithoutDuplicates;
  }

  function removeDuplicates(logEntries) {
    const logEntriesNoDuplicates = [];
    const duplicatesMap = new Map();

    for (const entry of logEntries) {
      const shortLine = entry.title.split(" ").splice(-2).join(" ");

      if (duplicatesMap.has(shortLine)) {
        const previousIndex = duplicatesMap.get(shortLine);
        const previousEntry = logEntriesNoDuplicates[previousIndex];

        // Increment the current entry's duplicateCounter with previous entry's counter
        entry.duplicateCounter = (previousEntry.duplicateCounter || 1) + 1;

        // Replace the previous entry with the current one
        logEntriesNoDuplicates[previousIndex] = entry;
      } else {
        entry.duplicateCounter = 1;
        logEntriesNoDuplicates.push(entry);
        duplicatesMap.set(shortLine, logEntriesNoDuplicates.length - 1);
      }
    }

    return logEntriesNoDuplicates;
  }

  function saveResults() {
    try {
      const response = axios.post("/api/saveResults", results);
      console.log(response);
    } catch (err) {
      console.error(err);
    }
  }

  return { startScan, startAutoRefresh };
}
