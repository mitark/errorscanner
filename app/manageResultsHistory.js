import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// haetaan __dirname manuaalisesti koska ES6 path moduuli ei jostain syystä sisällä __dirnamee
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const resultsDir = path.join(__dirname, "/results");

export function saveResults(results) {
  const now = new Date();
  const Day = now.getDate();
  const Month = now.getMonth() + 1;
  const Hour = now.getHours();

  const dataToString = JSON.stringify(results);

  deleteOldResults(Month);

  const filePath = path.join(resultsDir, `results_${Month}_${Day}_${Hour}.json`);

  fs.writeFile(filePath, dataToString, (err) => {
    if (err) {
      console.log(err);
      return;
    } else {
      console.log(`Saved results from ${Day}.${Month}. at ${Hour}:00`);
      return;
    }
  });
}

function deleteOldResults(Month) {
  const lastMonth = Month - 1;
  const files = fs.readdirSync(resultsDir);
  for (const file of files) {
    if (file.includes(`results_${lastMonth}`)) {
      fs.unlink(path.join(resultsDir, file), (err) => {
        if (err) console.log(err);
        else console.log("Deleted file", file);
      });
    }
  }
}

export function getFilePath(Day, Month, Hour) {
  try {
    const files = fs.readdirSync(resultsDir);
    for (const file of files) {
      if (file.includes(`results_${Month}_${Day}_${Hour}.json`)) {
        const filePath = path.join(resultsDir, file);
        return filePath;
      }
    }
  } catch (err) {
    console.log(err);
    return "No results found";
  }

  console.log(`Results results_${Month}_${Day}_${Hour}.json not found`);
  return "No results found";
}
