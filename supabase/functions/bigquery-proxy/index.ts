import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Helper: Create a JWT for Google OAuth2 using the service account
async function createGoogleJWT(serviceAccount: any): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/bigquery.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const claimB64 = btoa(JSON.stringify(claim)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsignedToken = `${headerB64}.${claimB64}`;

  // Import the private key
  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(unsignedToken)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${unsignedToken}.${sigB64}`;
}

// Get an access token from Google
async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwt = await createGoogleJWT(serviceAccount);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get("GCP_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountJson) {
      throw new Error("GCP_SERVICE_ACCOUNT_JSON secret is not configured");
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);

    const { action, projectId, datasetId, tableId, pageSize, pageToken } = await req.json();

    const BQ_BASE = "https://bigquery.googleapis.com/bigquery/v2";
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // Action: List tables in a dataset
    if (action === "list-tables") {
      if (!projectId || !datasetId) {
        throw new Error("projectId and datasetId are required");
      }
      const url = `${BQ_BASE}/projects/${projectId}/datasets/${datasetId}/tables?maxResults=100`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(`BigQuery API error [${res.status}]: ${JSON.stringify(data)}`);

      const tables = (data.tables || []).map((t: any) => ({
        id: t.tableReference.tableId,
        name: t.tableReference.tableId,
        type: t.type, // TABLE or VIEW
        rowCount: t.numRows ? parseInt(t.numRows) : null,
      }));

      return new Response(JSON.stringify({ tables }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: Get table schema
    if (action === "get-schema") {
      if (!projectId || !datasetId || !tableId) {
        throw new Error("projectId, datasetId, and tableId are required");
      }
      const url = `${BQ_BASE}/projects/${projectId}/datasets/${datasetId}/tables/${tableId}`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(`BigQuery API error [${res.status}]: ${JSON.stringify(data)}`);

      const fields = (data.schema?.fields || []).map((f: any) => ({
        name: f.name,
        type: f.type, // STRING, INTEGER, FLOAT, NUMERIC, DATE, TIMESTAMP, BOOLEAN, etc.
        mode: f.mode, // NULLABLE, REQUIRED, REPEATED
      }));

      return new Response(JSON.stringify({ fields, totalRows: data.numRows }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: Query table data
    if (action === "query-data") {
      if (!projectId || !datasetId || !tableId) {
        throw new Error("projectId, datasetId, and tableId are required");
      }
      const limit = pageSize || 5000;
      const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` LIMIT ${limit}`;

      const url = `${BQ_BASE}/projects/${projectId}/queries`;
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query,
          useLegacySql: false,
          maxResults: limit,
          pageToken: pageToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`BigQuery API error [${res.status}]: ${JSON.stringify(data)}`);

      // Transform BigQuery response to flat records
      const schema = data.schema?.fields || [];
      const rows = (data.rows || []).map((row: any) => {
        const record: Record<string, any> = {};
        row.f.forEach((cell: any, i: number) => {
          const field = schema[i];
          const val = cell.v;
          if (val === null || val === undefined) {
            record[field.name] = null;
          } else if (["INTEGER", "INT64"].includes(field.type)) {
            record[field.name] = parseInt(val);
          } else if (["FLOAT", "FLOAT64", "NUMERIC", "BIGNUMERIC"].includes(field.type)) {
            record[field.name] = parseFloat(val);
          } else if (field.type === "BOOLEAN") {
            record[field.name] = val === "true";
          } else {
            record[field.name] = val;
          }
          return record;
        });
        return record;
      });

      return new Response(JSON.stringify({
        rows,
        totalRows: data.totalRows ? parseInt(data.totalRows) : rows.length,
        pageToken: data.pageToken || null,
        schema: schema.map((f: any) => ({ name: f.name, type: f.type })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: List datasets in a project
    if (action === "list-datasets") {
      if (!projectId) {
        throw new Error("projectId is required");
      }
      const url = `${BQ_BASE}/projects/${projectId}/datasets?maxResults=100`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(`BigQuery API error [${res.status}]: ${JSON.stringify(data)}`);

      const datasets = (data.datasets || []).map((d: any) => ({
        id: d.datasetReference.datasetId,
        name: d.datasetReference.datasetId,
      }));

      return new Response(JSON.stringify({ datasets }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("BigQuery proxy error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
