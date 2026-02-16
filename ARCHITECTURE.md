# Campaign Analytics Bot - Complete Architecture
## Privacy-Preserving Conversational Analytics Platform

---

## 1. EXECUTIVE SUMMARY

This document provides a comprehensive blueprint for building a **production-grade campaign analytics bot** that enables natural language interaction with encrypted campaign performance data stored in GCP. The solution ensures **zero data exposure to LLMs** while delivering powerful analytics capabilities.

### Key Differentiators
- **Zero-Knowledge Architecture**: Data never leaves encrypted state until your secure environment
- **Conversational Analytics**: Natural language queries → SQL → Visualizations
- **Enterprise Export**: PDF/PPT generation with your branding
- **Wow Factor**: AI-powered insights with explainable reasoning

---

## 2. RESEARCH FOUNDATION

### 2.1 Academic Papers & Research

| Research Area | Key Paper | Relevance |
|--------------|-----------|-----------|
| **Privacy-Preserving LLM Interaction** | [Bae et al., 2025](https://arxiv.org/html/2506.17336v1) - "Privacy-Preserving LLM Interaction with Socratic Chain-of-Thought Reasoning and Homomorphically Encrypted Vector Databases" | Core architecture for encrypted data + LLM interaction |
| **Text-to-SQL Enterprise** | [Microsoft/Waii, 2025](https://arxiv.org/html/2507.14372v1) - "Text-to-SQL for Enterprise Data Analytics" | Query generation patterns for complex schemas |
| **Conversational BI** | [Cherednichenko et al., 2024](https://eric.univ-lyon2.fr/bi4people/paul/docs/5_EGC_2024_paper_9527-2.pdf) - "Towards Collaborative Business Intelligence" | Chatbot-BI integration patterns |
| **Encrypted Analytics** | [ICLR 2025](https://proceedings.iclr.cc/paper_files/paper/2025/file/6715b4e97be055687c1ecaf33913d358-Paper-Conference.pdf) - "Encryption-Friendly LLM Architecture" | HE operations for ML inference |
| **Secure MPC for LLMs** | [arXiv 2025](https://arxiv.org/html/2509.25072v1) - "Optimizing Privacy-Preserving Primitives" | Multi-party computation optimizations |

### 2.2 Industry Implementations

| Company | Implementation | Lessons |
|---------|---------------|---------|
| **Uber** | QueryGPT - Natural Language to SQL | Schema-aware RAG improves accuracy 40% |
| **Microsoft** | Power BI Copilot | Context window management critical |
| **Google** | BigQuery NL Interface | Column descriptions essential for accuracy |
| **Vanna.AI** | Open-source Text2SQL | Few-shot examples improve query correctness |

---

## 3. SYSTEM ARCHITECTURE

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (React + Node.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Chat Interface│  │ Visualization│  │ Export (PDF/ │  │ Dashboard    │    │
│  │             │  │ Engine       │  │    PPT)      │  │ Builder      │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
└─────────┼────────────────┼────────────────┼────────────────┼─────────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │      API GATEWAY (Express)   │
                    │   - Auth (JWT + API Keys)    │
                    │   - Rate Limiting            │
                    │   - Request Validation       │
                    └──────────────┬──────────────┘
                                   │
┌──────────────────────────────────┼──────────────────────────────────────────┐
│                         SERVICE LAYER (Node.js)                              │
│  ┌──────────────────┐  ┌────────┴───────┐  ┌──────────────────┐             │
│  │ Query Orchestrator│  │ Encryption     │  │ Export Service   │             │
│  │                  │  │ Service        │  │                  │             │
│  │ - NL→SQL         │  │                │  │ - PDF Generation │             │
│  │ - Query Planning │  │ - AES-256-GCM  │  │ - PPT Generation │             │
│  │ - Result Format  │  │ - Field-level  │  │ - Template Mgmt  │             │
│  └────────┬─────────┘  └────────┬───────┘  └────────┬─────────┘             │
│           │                     │                   │                        │
│  ┌────────┴─────────┐  ┌────────┴───────┐  ┌────────┴─────────┐             │
│  │ LLM Gateway      │  │ Data Access    │  │ Visualization    │             │
│  │                  │  │ Layer          │  │ Engine           │             │
│  │ - Prompt Mgmt    │  │                │  │                  │             │
│  │ - Response Parse │  │ - Connection   │  │ - Chart.js/D3    │             │
│  │ - Token Opt      │  │   Pooling      │  │ - Real-time      │             │
│  └──────────────────┘  │ - Query Exec   │  │   Updates        │             │
│                        └────────┬───────┘  └──────────────────┘             │
└─────────────────────────────────┼──────────────────────────────────────────┘
                                  │
┌─────────────────────────────────┼──────────────────────────────────────────┐
│                         DATA LAYER (GCP)                                     │
│  ┌──────────────────┐  ┌────────┴───────┐  ┌──────────────────┐             │
│  │ Cloud Storage    │  │ BigQuery       │  │ Secret Manager   │             │
│  │ (Encrypted Files)│  │ (Analytics DB) │  │ (Keys/Secrets)   │             │
│  └──────────────────┘  └────────────────┘  └──────────────────┘             │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │ Cloud KMS        │  │ Cloud Run        │  │ Vertex AI        │          │
│  │ (Key Management) │  │ (Container Host) │  │ (LLM Gateway)    │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow - Privacy-First Query Execution

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │────▶│   Natural   │────▶│   Schema    │────▶│   LLM       │
│   Query     │     │   Language  │     │   Context   │     │   (OpenAI/  │
│             │     │   Parser    │     │   (Metadata)│     │   Vertex)   │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                    │
                                                                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Results   │◀────│   Decrypt   │◀────│   Execute   │◀────│   SQL       │
│   (Visual)  │     │   (Secure   │     │   BigQuery  │     │   Query     │
│             │     │   Enclave)  │     │   (Encrypted│     │             │
└─────────────┘     └─────────────┘     │   Data)     │     └─────────────┘
                                        └─────────────┘
```

---

## 4. SECURITY ARCHITECTURE

### 4.1 Encryption Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ENCRYPTION LAYERS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  LAYER 1: FIELD-LEVEL ENCRYPTION (Application Layer)                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  • AES-256-GCM for sensitive fields (campaign_name, client_id)  │    │
│  │  • Deterministic encryption for queryable fields                │    │
│  │  • Randomized encryption for non-queryable data                 │    │
│  │  • Each field has separate data encryption key (DEK)            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  LAYER 2: TRANSPORT ENCRYPTION (TLS 1.3)                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  • All API communications over HTTPS                            │    │
│  │  • mTLS for service-to-service communication                    │    │
│  │  • Certificate pinning for mobile clients                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  LAYER 3: DATABASE ENCRYPTION (GCP Default)                             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  • BigQuery CMEK (Customer-Managed Encryption Keys)             │    │
│  │  • Cloud Storage encryption at rest                             │    │
│  │  • Key rotation every 90 days                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  LAYER 4: KEY MANAGEMENT (Cloud KMS)                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  • KEK (Key Encryption Key) in Cloud KMS                        │    │
│  │  • DEK (Data Encryption Key) encrypted with KEK                 │    │
│  │  • Envelope encryption pattern                                    │    │
│  │  • HSM-backed key storage                                         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Zero-Knowledge Query Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ZERO-KNOWLEDGE QUERY EXECUTION                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Step 1: User sends query (NO DATA SENT)                                │
│  ┌─────────┐    "Show me top campaigns by ROI last quarter"              │
│  │  User   │──────────────────────────────────────────────────▶          │
│  └─────────┘                                                             │
│                                                                          │
│  Step 2: Schema metadata sent to LLM (NO ACTUAL DATA)                   │
│  ┌─────────┐    {table: "campaigns", columns: ["roi", "spend", ...]}    │
│  │  LLM    │◀──────────────────────────────────────────────────          │
│  └─────────┘                                                             │
│                                                                          │
│  Step 3: LLM generates SQL query                                        │
│  ┌─────────┐    "SELECT campaign_name, roi FROM campaigns..."            │
│  │  LLM    │──────────────────────────────────────────────────▶          │
│  └─────────┘                                                             │
│                                                                          │
│  Step 4: Query executed on ENCRYPTED data in YOUR environment           │
│  ┌─────────┐    [Encrypted results decrypted in secure enclave]          │
│  │BigQuery │◀──────────────────────────────────────────────────          │
│  └─────────┘                                                             │
│                                                                          │
│  Step 5: Decrypted results visualized                                   │
│  ┌─────────┐    [Charts, graphs, insights]                               │
│  │  User   │◀──────────────────────────────────────────────────          │
│  └─────────┘                                                             │
│                                                                          │
│  ★ CRITICAL: LLM NEVER sees actual campaign data, only metadata         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. TECHNOLOGY STACK

### 5.1 Frontend Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React 18 + TypeScript | UI components |
| **Build Tool** | Vite | Fast development & production builds |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS |
| **UI Components** | shadcn/ui | Pre-built accessible components |
| **State Management** | Zustand | Lightweight state management |
| **Charts** | Recharts + D3.js | Data visualization |
| **Chat Interface** | Custom + react-chat-widget | Conversational UI |
| **Export** | html2canvas + jsPDF + pptxgenjs | PDF/PPT generation |

### 5.2 Backend Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Node.js 20 | Server runtime |
| **Framework** | Express.js 4 | API server |
| **Language** | TypeScript | Type safety |
| **Database** | BigQuery | Analytics data warehouse |
| **ORM/Query** | @google-cloud/bigquery | BigQuery client |
| **Auth** | Passport.js + JWT | Authentication |
| **Encryption** | crypto (Node.js built-in) | AES-256-GCM |
| **LLM Client** | OpenAI SDK + Vertex AI SDK | LLM integration |
| **PDF Generation** | Puppeteer + Handlebars | Server-side PDF |
| **PPT Generation** | pptxgenjs | PowerPoint export |

### 5.3 GCP Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **BigQuery** | Data warehouse | CMEK encryption, partitioned tables |
| **Cloud Storage** | File storage | Encrypted buckets, lifecycle policies |
| **Cloud KMS** | Key management | HSM keys, rotation policy |
| **Secret Manager** | Secrets storage | Automatic rotation, access audit |
| **Cloud Run** | Container hosting | Auto-scaling, private endpoints |
| **Vertex AI** | LLM hosting | Private endpoints, model monitoring |
| **Cloud IAM** | Access control | Principle of least privilege |
| **Cloud Audit** | Activity logging | Comprehensive audit trail |

---

## 6. DATABASE SCHEMA

### 6.1 Core Tables (BigQuery)

```sql
-- Campaign Master Table (Encrypted Fields)
CREATE TABLE campaign_analytics.campaigns (
  campaign_id STRING NOT NULL,
  campaign_name_encrypted BYTES NOT NULL,  -- AES-256-GCM encrypted
  client_id_encrypted BYTES NOT NULL,      -- AES-256-GCM encrypted
  campaign_type STRING,                    -- PLAINTEXT: filterable
  start_date DATE,                         -- PLAINTEXT: filterable
  end_date DATE,                           -- PLAINTEXT: filterable
  budget_encrypted BYTES,                  -- AES-256-GCM encrypted
  currency STRING,                         -- PLAINTEXT
  status STRING,                           -- PLAINTEXT: active/paused/completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP,
  
  -- Partitioning and clustering for performance
  PARTITION BY DATE(created_at)
  CLUSTER BY campaign_type, status
);

-- Performance Metrics Table (Time-series)
CREATE TABLE campaign_analytics.daily_metrics (
  metric_id STRING NOT NULL,
  campaign_id STRING NOT NULL,
  date DATE NOT NULL,
  
  -- Media metrics (encrypted)
  impressions_encrypted BYTES,
  clicks_encrypted BYTES,
  spend_encrypted BYTES,
  
  -- Conversion metrics (encrypted)
  conversions_encrypted BYTES,
  revenue_encrypted BYTES,
  
  -- Derived metrics (calculated at query time)
  -- ctr, cpc, cpm, roas computed on-the-fly
  
  -- Channel breakdown (plaintext for filtering)
  channel STRING,  -- search, social, display, video, etc.
  device STRING,   -- mobile, desktop, tablet
  geography STRING, -- country/region code
  
  loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  
  PARTITION BY DATE(date)
  CLUSTER BY campaign_id, channel, geography
);

-- Media Activation Details
CREATE TABLE campaign_analytics.media_activations (
  activation_id STRING NOT NULL,
  campaign_id STRING NOT NULL,
  
  -- Platform details
  platform STRING,  -- Google Ads, Meta, TikTok, etc.
  placement STRING, -- feed, story, search, etc.
  
  -- Creative info (encrypted)
  creative_name_encrypted BYTES,
  creative_type STRING,  -- video, image, carousel
  
  -- Targeting (encrypted)
  audience_segment_encrypted BYTES,
  
  -- Performance
  bid_strategy STRING,
  budget_allocated_encrypted BYTES,
  
  created_at TIMESTAMP,
  
  CLUSTER BY campaign_id, platform
);

-- Schema Metadata (for LLM context)
CREATE TABLE campaign_analytics.schema_metadata (
  table_name STRING NOT NULL,
  column_name STRING NOT NULL,
  data_type STRING,
  description STRING,  -- Human-readable description for LLM
  is_encrypted BOOLEAN,
  is_queryable BOOLEAN,
  sample_values ARRAY<STRING>,  -- Example values (sanitized)
  foreign_key STRING,
  updated_at TIMESTAMP
);
```

### 6.2 Encryption Schema

```typescript
interface EncryptionConfig {
  // Algorithm configuration
  algorithm: 'aes-256-gcm';
  keyLength: 32;
  ivLength: 16;
  tagLength: 16;
  
  // Field-level configuration
  fields: {
    [tableName: string]: {
      [columnName: string]: {
        encrypt: boolean;
        deterministic: boolean;  // true = searchable, false = random
        deks: string[];  // Data encryption keys (encrypted with KEK)
      }
    }
  };
  
  // Key rotation
  rotationPolicy: {
    enabled: boolean;
    intervalDays: 90;
    gracePeriodDays: 7;
  };
}
```

---

## 7. API DESIGN

### 7.1 REST Endpoints

```yaml
# Authentication
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
DELETE /api/v1/auth/logout

# Conversational Analytics
POST   /api/v1/chat/query           # Natural language query
GET    /api/v1/chat/history         # Conversation history
DELETE /api/v1/chat/:id             # Delete conversation

# Query Management
POST   /api/v1/queries/execute      # Execute SQL directly (admin)
GET    /api/v1/queries/saved        # List saved queries
POST   /api/v1/queries/save         # Save query

# Visualizations
POST   /api/v1/visualizations/generate  # Generate chart config
GET    /api/v1/visualizations/types     # Available chart types

# Export
POST   /api/v1/export/pdf           # Export to PDF
POST   /api/v1/export/ppt           # Export to PowerPoint
GET    /api/v1/export/templates     # List export templates

# Data Management (Admin)
POST   /api/v1/admin/encrypt        # Encrypt new data
POST   /api/v1/admin/rotate-keys    # Rotate encryption keys
GET    /api/v1/admin/audit-log      # Access audit log
```

### 7.2 WebSocket Events (Real-time)

```typescript
// Client → Server
interface ClientEvents {
  'query:stream': { query: string; conversationId?: string };
  'query:cancel': { queryId: string };
  'chart:update': { chartId: string; config: ChartConfig };
}

// Server → Client
interface ServerEvents {
  'query:thinking': { queryId: string; message: string };
  'query:sql': { queryId: string; sql: string };
  'query:results': { queryId: string; data: any[]; metadata: QueryMetadata };
  'query:visualization': { queryId: string; chartConfig: ChartConfig };
  'query:insights': { queryId: string; insights: string[] };
  'query:error': { queryId: string; error: string };
  'query:complete': { queryId: string };
}
```

---

## 8. QUERY ORCHESTRATION ENGINE

### 8.1 NL→SQL Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    NATURAL LANGUAGE QUERY PIPELINE                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Input: "Show me top 5 campaigns by ROAS in Q4 2024 for retail clients" │
│                                                                          │
│  ┌─────────────┐                                                         │
│  │  Step 1:    │  Intent Classification                                  │
│  │  Intent     │  → Type: aggregation_query                              │
│  │  Detection  │  → Entities: [time_range, metric, limit, segment]       │
│  └──────┬──────┘                                                         │
│         │                                                                │
│  ┌──────▼──────┐                                                         │
│  │  Step 2:    │  Context Retrieval (RAG)                                │
│  │  Context    │  → Retrieve relevant tables, columns, examples          │
│  │  Retrieval  │  → Schema: campaigns, daily_metrics                     │
│  └──────┬──────┘                                                         │
│         │                                                                │
│  ┌──────▼──────┐                                                         │
│  │  Step 3:    │  SQL Generation (LLM)                                   │
│  │  SQL Gen    │  → Generate with schema context + few-shot examples     │
│  └──────┬──────┘                                                         │
│         │                                                                │
│  ┌──────▼──────┐                                                         │
│  │  Step 4:    │  Query Validation                                       │
│  │  Validate   │  → Syntax check, permission check, injection scan       │
│  └──────┬──────┘                                                         │
│         │                                                                │
│  ┌──────▼──────┐                                                         │
│  │  Step 5:    │  Query Execution (on encrypted data)                    │
│  │  Execute    │  → Decrypt results in secure enclave                    │
│  └──────┬──────┘                                                         │
│         │                                                                │
│  ┌──────▼──────┐                                                         │
│  │  Step 6:    │  Result Formatting                                      │
│  │  Format     │  → Format for visualization, generate insights          │
│  └─────────────┘                                                         │
│                                                                          │
│  Output: Formatted results + chart config + AI insights                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Prompt Template

```typescript
const NL_TO_SQL_PROMPT = `
You are an expert SQL generator for campaign analytics.
Convert the user's natural language query into a BigQuery SQL query.

DATABASE SCHEMA:
{{schema_context}}

SIMILAR EXAMPLES:
{{few_shot_examples}}

USER QUERY: {{user_query}}

RULES:
1. Only use tables and columns from the provided schema
2. For encrypted fields, use the decrypt_udf() function
3. Always filter by tenant_id for multi-tenancy
4. Use appropriate aggregations and GROUP BY
5. Add reasonable LIMIT clauses
6. Use standard BigQuery SQL syntax

OUTPUT FORMAT:
{
  "sql": "SELECT ...",
  "explanation": "Brief explanation of what this query does",
  "chart_type": "bar|line|pie|table|metric",
  "x_axis": "column_name",
  "y_axis": "column_name",
  "confidence": 0.95
}
`;
```

---

## 9. VISUALIZATION ENGINE

### 9.1 Chart Types Supported

| Chart Type | Use Case | Data Requirements |
|------------|----------|-------------------|
| **Metric Card** | Single KPI display | 1 value + optional comparison |
| **Bar Chart** | Category comparison | 1+ categories, 1+ metrics |
| **Line Chart** | Time-series trends | Date/time, 1+ metrics |
| **Area Chart** | Cumulative trends | Date/time, 1 metric |
| **Pie Chart** | Part-to-whole | Categories, 1 metric |
| **Donut Chart** | Part-to-whole (modern) | Categories, 1 metric |
| **Stacked Bar** | Composition over categories | Categories, sub-categories, metric |
| **Grouped Bar** | Multi-metric comparison | Categories, 2+ metrics |
| **Funnel Chart** | Conversion flow | Stages, values |
| **Heatmap** | Matrix patterns | 2 dimensions, 1 metric |
| **Scatter Plot** | Correlation analysis | 2 metrics, optional category |
| **Combo Chart** | Mixed visualization | Time, 2+ metrics (different scales) |

### 9.2 Auto-Chart Selection Logic

```typescript
function selectChartType(queryResult: QueryResult, userIntent: Intent): ChartType {
  const { columns, rowCount, data } = queryResult;
  const dateColumns = columns.filter(c => c.type === 'DATE' || c.type === 'TIMESTAMP');
  const numericColumns = columns.filter(c => c.type === 'NUMERIC' || c.type === 'INTEGER');
  const categoricalColumns = columns.filter(c => c.type === 'STRING');
  
  // Time-series detection
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    if (userIntent.aggregation === 'trend') return 'line';
    if (userIntent.aggregation === 'comparison') return 'bar';
    return 'line';
  }
  
  // Single metric display
  if (columns.length === 1 && numericColumns.length === 1) {
    return 'metric';
  }
  
  // Part-to-whole
  if (categoricalColumns.length === 1 && numericColumns.length === 1) {
    if (rowCount <= 6) return 'donut';
    return 'bar';
  }
  
  // Multi-metric comparison
  if (numericColumns.length >= 2) {
    return 'grouped_bar';
  }
  
  return 'table';
}
```

---

## 10. EXPORT SYSTEM

### 10.1 PDF Export

```typescript
interface PDFExportConfig {
  // Content
  title: string;
  subtitle?: string;
  includeDate: boolean;
  
  // Sections
  sections: {
    type: 'header' | 'text' | 'chart' | 'table' | 'insights';
    content: any;
    pageBreak?: boolean;
  }[];
  
  // Styling
  theme: {
    primaryColor: string;
    fontFamily: string;
    logo?: string;
  };
  
  // Metadata
  author: string;
  company: string;
  confidential: boolean;
}
```

### 10.2 PowerPoint Export

```typescript
interface PPTExportConfig {
  // Presentation metadata
  title: string;
  author: string;
  company: string;
  
  // Slides
  slides: {
    layout: 'title' | 'content' | 'chart' | 'table' | 'two_column';
    title: string;
    content: any;
    notes?: string;
  }[];
  
  // Master slide template
  masterTemplate: {
    backgroundColor: string;
    logo: string;
    footer: string;
  };
}
```

---

## 11. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-2)
- [ ] GCP project setup with required APIs
- [ ] BigQuery schema design and implementation
- [ ] Encryption layer implementation
- [ ] Basic Express.js API server
- [ ] Database connection and query execution

### Phase 2: Core Backend (Weeks 3-4)
- [ ] NL→SQL query engine
- [ ] LLM integration (OpenAI/Vertex AI)
- [ ] Authentication & authorization
- [ ] WebSocket server for real-time updates
- [ ] Query caching and optimization

### Phase 3: Frontend (Weeks 5-6)
- [ ] React + TypeScript setup
- [ ] Chat interface component
- [ ] Visualization components (Recharts)
- [ ] Dashboard builder
- [ ] Export UI (PDF/PPT)

### Phase 4: Advanced Features (Weeks 7-8)
- [ ] Advanced chart types
- [ ] AI-powered insights generation
- [ ] Conversation memory
- [ ] Custom export templates
- [ ] Performance optimization

### Phase 5: Production (Weeks 9-10)
- [ ] Security audit
- [ ] Load testing
- [ ] Documentation
- [ ] Deployment automation
- [ ] Monitoring and alerting

---

## 12. GCP SETUP CHECKLIST

### 12.1 Project Configuration

```bash
# 1. Create GCP Project
gcloud projects create campaign-analytics-bot --name="Campaign Analytics Bot"
gcloud config set project campaign-analytics-bot

# 2. Enable APIs
gcloud services enable bigquery.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable kms.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable monitoring.googleapis.com

# 3. Create Service Account
gcloud iam service-accounts create analytics-bot \
  --display-name="Campaign Analytics Bot"

# 4. Grant Permissions
gcloud projects add-iam-policy-binding campaign-analytics-bot \
  --member="serviceAccount:analytics-bot@campaign-analytics-bot.iam.gserviceaccount.com" \
  --role="roles/bigquery.dataViewer"

gcloud projects add-iam-policy-binding campaign-analytics-bot \
  --member="serviceAccount:analytics-bot@campaign-analytics-bot.iam.gserviceaccount.com" \
  --role="roles/bigquery.jobUser"

gcloud projects add-iam-policy-binding campaign-analytics-bot \
  --member="serviceAccount:analytics-bot@campaign-analytics-bot.iam.gserviceaccount.com" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"

gcloud projects add-iam-policy-binding campaign-analytics-bot \
  --member="serviceAccount:analytics-bot@campaign-analytics-bot.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding campaign-analytics-bot \
  --member="serviceAccount:analytics-bot@campaign-analytics-bot.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

### 12.2 BigQuery Setup

```bash
# Create dataset
bq mk --dataset --location=US campaign_analytics

# Create tables (run SQL from section 6.1)
bq query --use_legacy_sql=false < schema.sql

# Set up CMEK
bq mk --table --kms_key=projects/campaign-analytics-bot/locations/us/keyRings/analytics/cryptoKeys/bigquery-key campaign_analytics.campaigns
```

### 12.3 Cloud KMS Setup

```bash
# Create key ring
gcloud kms keyrings create analytics --location=us

# Create encryption key
gcloud kms keys create data-encryption-key \
  --location=us \
  --keyring=analytics \
  --purpose=encryption \
  --protection-level=hsm \
  --rotation-period=90d

# Create key for DEK encryption
gcloud kms keys create kek-encryption-key \
  --location=us \
  --keyring=analytics \
  --purpose=encryption \
  --protection-level=hsm
```

---

## 13. COST ESTIMATION

### 13.1 Monthly Costs (Estimated)

| Component | Usage | Cost (USD) |
|-----------|-------|------------|
| **BigQuery** | 1TB storage, 100GB query | $50 |
| **Cloud Run** | 2 vCPU, 4GB RAM, always-on | $100 |
| **Vertex AI** | 10K predictions/month | $50 |
| **Cloud KMS** | 10K operations | $5 |
| **Cloud Storage** | 100GB | $5 |
| **Secret Manager** | 50 secrets | $10 |
| **OpenAI API** | 100K tokens/day | $200 |
| **Total** | | **~$420/month** |

---

## 14. SECURITY CHECKLIST

### 14.1 Pre-Deployment Security Review

- [ ] All data encrypted at rest (BigQuery CMEK)
- [ ] All data encrypted in transit (TLS 1.3)
- [ ] Field-level encryption for PII/sensitive data
- [ ] Key rotation policy implemented
- [ ] Service account permissions minimal (PoLP)
- [ ] API rate limiting configured
- [ ] SQL injection prevention implemented
- [ ] Input validation on all endpoints
- [ ] Audit logging enabled
- [ ] VPC Service Controls configured
- [ ] Cloud Armor for DDoS protection
- [ ] Data loss prevention (DLP) scanning

---

## 15. MONITORING & OBSERVABILITY

### 15.1 Key Metrics

| Category | Metric | Alert Threshold |
|----------|--------|-----------------|
| **Performance** | API response time | > 2s |
| **Performance** | Query execution time | > 10s |
| **Performance** | LLM response time | > 5s |
| **Reliability** | Error rate | > 1% |
| **Reliability** | Failed queries | > 5% |
| **Security** | Failed auth attempts | > 10/min |
| **Cost** | Daily BigQuery spend | > $50 |
| **Usage** | Active users | Drop > 50% |

---

## 16. CONCLUSION

This architecture provides:

1. **Complete Privacy**: Zero data exposure to LLMs through field-level encryption
2. **Powerful Analytics**: Natural language to SQL with intelligent visualization
3. **Enterprise Export**: Professional PDF/PPT generation
4. **Production Ready**: Scalable, secure, monitored infrastructure
5. **Wow Factor**: AI-powered insights with explainable reasoning

The implementation follows industry best practices from leading research papers and enterprise implementations, ensuring your bot will be both cutting-edge and reliable.
