# Campaign Analytics Bot
## Privacy-Preserving Conversational Analytics Platform

A production-grade campaign analytics bot that enables natural language interaction with encrypted campaign performance data stored in GCP. The solution ensures **zero data exposure to LLMs** while delivering powerful analytics capabilities with professional PDF/PPT export.

---

## Features

### Core Capabilities
- **Natural Language Queries**: Ask questions in plain English about your campaign performance
- **Privacy-First Architecture**: Data never leaves encrypted state until your secure environment
- **Intelligent Visualizations**: Auto-generated charts based on query intent
- **AI-Powered Insights**: Automatic generation of key insights from query results
- **Professional Export**: PDF and PowerPoint generation with custom branding
- **Real-time Streaming**: Live updates as queries are processed

### Security Features
- **Field-Level Encryption**: AES-256-GCM encryption for sensitive fields
- **Envelope Encryption**: KEK (Key Encryption Key) in Cloud KMS, DEK (Data Encryption Key) per field
- **Zero-Knowledge Queries**: LLM only sees schema metadata, never actual data
- **Key Rotation**: Automated key rotation every 90 days
- **Audit Logging**: Comprehensive audit trail of all data access

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (React + TypeScript)                  │
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

---

## Quick Start

### Prerequisites
- Node.js 20+
- GCP Account with billing enabled
- OpenAI API key
- Service account with appropriate permissions

### 1. Clone and Install

```bash
cd campaign-analytics-bot
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Setup GCP Resources

```bash
# Run the setup script
bash scripts/setup-gcp.sh
```

### 4. Run Development Server

```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run dev:client  # Frontend only
npm run dev:server  # Backend only
```

### 5. Access the Application

- Frontend: http://localhost:5173
- API: http://localhost:3001/api/v1

---

## GCP Setup

### Enable APIs

```bash
gcloud services enable bigquery.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable kms.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable aiplatform.googleapis.com
```

### Create Service Account

```bash
gcloud iam service-accounts create analytics-bot \
  --display-name="Campaign Analytics Bot"

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:analytics-bot@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/bigquery.dataViewer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:analytics-bot@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/bigquery.jobUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:analytics-bot@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"
```

### Create BigQuery Dataset

```bash
bq mk --dataset --location=US campaign_analytics

# Run schema creation
bq query --use_legacy_sql=false < scripts/schema.sql
```

### Setup Cloud KMS

```bash
# Create key ring
gcloud kms keyrings create analytics --location=us

# Create encryption key
gcloud kms keys create data-encryption-key \
  --location=us \
  --keyring=analytics \
  --purpose=encryption \
  --protection-level=hsm
```

---

## Usage

### Natural Language Queries

The bot understands queries like:

- "Show me top campaigns by ROI last month"
- "What was our total spend in Q4 2024?"
- "Compare CTR across different channels"
- "Daily spend trend for search campaigns"
- "Which campaigns have ROAS above 3.0?"

### Export Reports

After getting results, click:
- **Export PDF**: Generate a professional PDF report
- **Export PPT**: Generate a PowerPoint presentation

### Dashboard View

Switch to Dashboard view for:
- Real-time KPI metrics
- Performance trends
- Channel distribution
- Top campaigns

---

## API Endpoints

### Chat
- `POST /api/v1/chat/query` - Execute natural language query
- `GET /api/v1/chat/conversations` - List conversations
- `GET /api/v1/chat/conversation/:id` - Get conversation
- `DELETE /api/v1/chat/conversation/:id` - Delete conversation

### Export
- `POST /api/v1/export/pdf` - Export to PDF
- `POST /api/v1/export/ppt` - Export to PowerPoint

### Visualizations
- `POST /api/v1/visualizations/generate` - Generate chart config
- `GET /api/v1/visualizations/types` - List chart types

### Schema
- `GET /api/v1/schema` - Get database schema

---

## Research Foundation

This implementation is based on cutting-edge research:

| Paper | Key Insight |
|-------|-------------|
| **Privacy-Preserving LLM Interaction** (Bae et al., 2025) | Socratic CoT + Homomorphic Encryption for private LLM queries |
| **Text-to-SQL for Enterprise** (Microsoft/Waii, 2025) | Schema-aware RAG improves query accuracy 40% |
| **Conversational BI** (Cherednichenko et al., 2024) | Chatbot-BI integration patterns |
| **Encryption-Friendly LLM Architecture** (ICLR 2025) | HE operations for ML inference |

---

## Security

### Encryption Layers

1. **Field-Level Encryption**: AES-256-GCM for sensitive fields
2. **Transport Encryption**: TLS 1.3 for all communications
3. **Database Encryption**: BigQuery CMEK (Customer-Managed Encryption Keys)
4. **Key Management**: Cloud KMS with HSM-backed keys

### Zero-Knowledge Query Flow

```
User Query → Schema Metadata → LLM → SQL → Encrypted Data → Decrypt → Results
                ↑                                              ↑
         (No actual data)                              (Your secure env)
```

---

## Cost Estimation

| Component | Monthly Cost |
|-----------|-------------|
| BigQuery | ~$50 |
| Cloud Run | ~$100 |
| Vertex AI | ~$50 |
| Cloud KMS | ~$5 |
| OpenAI API | ~$200 |
| **Total** | **~$405/month** |

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

MIT License - See LICENSE file for details

---

## Support

For support, email support@yourcompany.com or open an issue on GitHub.

---

## Roadmap

- [ ] Multi-tenant support
- [ ] Custom chart templates
- [ ] Scheduled reports
- [ ] Slack/Teams integration
- [ ] Advanced filtering
- [ ] Custom metrics builder
- [ ] Data lineage tracking
- [ ] Anomaly detection
