require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { BigQuery } = require("@google-cloud/bigquery");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize BigQuery client
// Uses GOOGLE_APPLICATION_CREDENTIALS env var automatically,
// or falls back to inline JSON from GCP_SERVICE_ACCOUNT_JSON
function createBigQueryClient() {
  const inlineJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (inlineJson) {
    const credentials = JSON.parse(inlineJson);
    return new BigQuery({
      projectId: credentials.project_id,
      credentials,
    });
  }
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS file path
  return new BigQuery();
}

const bigquery = createBigQueryClient();

// List datasets in a project
app.post("/api/bigquery", async (req, res) => {
  try {
    const { action, projectId, datasetId, tableId, pageSize } = req.body;

    if (action === "list-datasets") {
      if (!projectId) throw new Error("projectId is required");
      const client = new BigQuery({ projectId });
      // Copy credentials from main client if using inline JSON
      if (process.env.GCP_SERVICE_ACCOUNT_JSON) {
        const creds = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON);
        const authedClient = new BigQuery({ projectId, credentials: creds });
        const [datasets] = await authedClient.getDatasets();
        return res.json({
          datasets: datasets.map((d) => ({
            id: d.id,
            name: d.id,
          })),
        });
      }
      const [datasets] = await new BigQuery({ projectId }).getDatasets();
      return res.json({
        datasets: datasets.map((d) => ({
          id: d.id,
          name: d.id,
        })),
      });
    }

    if (action === "list-tables") {
      if (!projectId || !datasetId) throw new Error("projectId and datasetId are required");
      const client = getBQClient(projectId);
      const [tables] = await client.dataset(datasetId).getTables();
      return res.json({
        tables: tables.map((t) => ({
          id: t.id,
          name: t.id,
          type: t.metadata?.type || "TABLE",
          rowCount: t.metadata?.numRows ? parseInt(t.metadata.numRows) : null,
        })),
      });
    }

    if (action === "get-schema") {
      if (!projectId || !datasetId || !tableId)
        throw new Error("projectId, datasetId, and tableId are required");
      const client = getBQClient(projectId);
      const [metadata] = await client.dataset(datasetId).table(tableId).getMetadata();
      const fields = (metadata.schema?.fields || []).map((f) => ({
        name: f.name,
        type: f.type,
        mode: f.mode,
      }));
      return res.json({ fields, totalRows: metadata.numRows });
    }

    if (action === "query-data") {
      if (!projectId || !datasetId || !tableId)
        throw new Error("projectId, datasetId, and tableId are required");
      const limit = pageSize || 5000;
      const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` LIMIT ${limit}`;
      const client = getBQClient(projectId);
      const [rows] = await client.query({ query });
      return res.json({
        rows,
        totalRows: rows.length,
        schema: Object.keys(rows[0] || {}).map((name) => ({
          name,
          type: typeof rows[0][name] === "number" ? "FLOAT" : "STRING",
        })),
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("BigQuery proxy error:", error);
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});

function getBQClient(projectId) {
  const inlineJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (inlineJson) {
    const credentials = JSON.parse(inlineJson);
    return new BigQuery({ projectId, credentials });
  }
  return new BigQuery({ projectId });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`BigQuery proxy server running on http://localhost:${PORT}`);
});
