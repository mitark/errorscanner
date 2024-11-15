import cors from "cors";
import express from "express";
import { getFilePath, saveResults } from "./manageResultsHistory.js";

const app = express();
const PORT = 3000;

const defaultObject = {
  servers: ["no results", "for this date"],
  totalErrorCount: 0,
  currentTime: new Date(2024, 0, 1, 0, 0, 0, 0),
  relevantErrorsObject: {},
  relevantLogsObject: {},
  connectionSuccess: true,
};

app.use(express.json({ limit: "50mb" }));
app.use(cors());

app.post("/saveResults", (req, res) => {
  try {
    saveResults(req.body);
    res.send("Results saved");
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to save results");
  }
});

app.post("/selectResults", async (req, res) => {
  const { Day, Month, Hour } = req.body.params;
  const path = getFilePath(Day, Month, Hour);
  if (path == "No results found" || path.includes(undefined)) res.send(defaultObject);
  else res.sendFile(path);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
