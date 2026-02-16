# GCP Setup Guide
## Complete Step-by-Step Configuration

This guide walks you through setting up all necessary GCP resources for the Campaign Analytics Bot.

---

## Table of Contents
1. [Project Setup](#1-project-setup)
2. [Enable APIs](#2-enable-apis)
3. [Service Account](#3-service-account)
4. [BigQuery Setup](#4-bigquery-setup)
5. [Cloud KMS Setup](#5-cloud-kms-setup)
6. [Cloud Storage Setup](#6-cloud-storage-setup)
7. [Secret Manager Setup](#7-secret-manager-setup)
8. [Network Configuration](#8-network-configuration)
9. [Verification](#9-verification)

---

## 1. Project Setup

### Create New Project

```bash
# Set your project name
export PROJECT_ID="campaign-analytics-bot-$(date +%s)"
export PROJECT_NAME="Campaign Analytics Bot"

# Create project
gcloud projects create $PROJECT_ID --name="$PROJECT_NAME"

# Set as default
gcloud config set project $PROJECT_ID

# Link to billing account (replace with your billing account ID)
export BILLING_ACCOUNT="XXXXXX-XXXXXX-XXXXXX"
gcloud billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT
```

### Set Environment Variables

```bash
# Add to your ~/.bashrc or ~/.zshrc
export GCP_PROJECT_ID=$PROJECT_ID
export GCP_REGION="us-central1"
export GCP_ZONE="us-central1-a"
```

---

## 2. Enable APIs

```bash
# Essential APIs
gcloud services enable bigquery.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable kms.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Verify all APIs are enabled
gcloud services list --enabled
```

---

## 3. Service Account

### Create Service Account

```bash
# Create service account
gcloud iam service-accounts create analytics-bot \
  --display-name="Campaign Analytics Bot" \
  --description="Service account for Campaign Analytics Bot"

# Export service account email
export SA_EMAIL="analytics-bot@$PROJECT_ID.iam.gserviceaccount.com"
```

### Grant Permissions

```bash
# BigQuery permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/bigquery.dataViewer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/bigquery.jobUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/bigquery.dataEditor"

# Cloud KMS permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudkms.viewer"

# Cloud Storage permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.objectCreator"

# Secret Manager permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor"

# Cloud Run permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/run.developer"

# Vertex AI permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/aiplatform.user"
```

### Create and Download Service Account Key

```bash
# Create key directory
mkdir -p ~/.gcp-keys

# Create and download key
gcloud iam service-accounts keys create ~/.gcp-keys/$PROJECT_ID-key.json \
  --iam-account=$SA_EMAIL

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.gcp-keys/$PROJECT_ID-key.json"

# Add to your shell profile
echo "export GOOGLE_APPLICATION_CREDENTIALS=\"$GOOGLE_APPLICATION_CREDENTIALS\"" >> ~/.bashrc
```

---

## 4. BigQuery Setup

### Create Dataset

```bash
# Create dataset with US location
bq mk --dataset \
  --location=US \
  --description="Campaign Analytics Data" \
  campaign_analytics
```

### Create Tables

```bash
# Create campaigns table
bq query --use_legacy_sql=false "
CREATE TABLE IF NOT EXISTS \`$PROJECT_ID.campaign_analytics.campaigns\` (
  campaign_id STRING NOT NULL,
  campaign_name_encrypted BYTES,
  client_id_encrypted BYTES,
  campaign_type STRING,
  start_date DATE,
  end_date DATE,
  budget_encrypted BYTES,
  currency STRING,
  status STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY campaign_type, status
OPTIONS(
  description='Campaign master table with encrypted fields',
  labels=[('env', 'production'), ('team', 'analytics')]
);
"

# Create daily_metrics table
bq query --use_legacy_sql=false "
CREATE TABLE IF NOT EXISTS \`$PROJECT_ID.campaign_analytics.daily_metrics\` (
  metric_id STRING NOT NULL,
  campaign_id STRING NOT NULL,
  date DATE NOT NULL,
  impressions_encrypted BYTES,
  clicks_encrypted BYTES,
  spend_encrypted BYTES,
  conversions_encrypted BYTES,
  revenue_encrypted BYTES,
  channel STRING,
  device STRING,
  geography STRING,
  loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(date)
CLUSTER BY campaign_id, channel, geography
OPTIONS(
  description='Daily performance metrics with encrypted values',
  labels=[('env', 'production'), ('team', 'analytics')]
);
"

# Create media_activations table
bq query --use_legacy_sql=false "
CREATE TABLE IF NOT EXISTS \`$PROJECT_ID.campaign_analytics.media_activations\` (
  activation_id STRING NOT NULL,
  campaign_id STRING NOT NULL,
  platform STRING,
  placement STRING,
  creative_name_encrypted BYTES,
  creative_type STRING,
  audience_segment_encrypted BYTES,
  bid_strategy STRING,
  budget_allocated_encrypted BYTES,
  created_at TIMESTAMP
)
CLUSTER BY campaign_id, platform
OPTIONS(
  description='Media activation details with encrypted fields',
  labels=[('env', 'production'), ('team', 'analytics')]
);
"

# Create schema_metadata table
bq query --use_legacy_sql=false "
CREATE TABLE IF NOT EXISTS \`$PROJECT_ID.campaign_analytics.schema_metadata\` (
  table_name STRING NOT NULL,
  column_name STRING NOT NULL,
  data_type STRING,
  description STRING,
  is_encrypted BOOLEAN,
  is_queryable BOOLEAN,
  sample_values ARRAY<STRING>,
  foreign_key STRING,
  updated_at TIMESTAMP
)
OPTIONS(
  description='Schema metadata for LLM context',
  labels=[('env', 'production'), ('team', 'analytics')]
);
"
```

### Insert Sample Schema Metadata

```bash
bq query --use_legacy_sql=false "
INSERT INTO \`$PROJECT_ID.campaign_analytics.schema_metadata\` VALUES
  ('campaigns', 'campaign_id', 'STRING', 'Unique campaign identifier', false, true, [], NULL, CURRENT_TIMESTAMP()),
  ('campaigns', 'campaign_name_encrypted', 'BYTES', 'Encrypted campaign name', true, false, [], NULL, CURRENT_TIMESTAMP()),
  ('campaigns', 'client_id_encrypted', 'BYTES', 'Encrypted client identifier', true, false, [], NULL, CURRENT_TIMESTAMP()),
  ('campaigns', 'campaign_type', 'STRING', 'Type of campaign (search, social, display, video)', false, true, ['search', 'social', 'display'], NULL, CURRENT_TIMESTAMP()),
  ('campaigns', 'start_date', 'DATE', 'Campaign start date', false, true, [], NULL, CURRENT_TIMESTAMP()),
  ('campaigns', 'end_date', 'DATE', 'Campaign end date', false, true, [], NULL, CURRENT_TIMESTAMP()),
  ('daily_metrics', 'metric_id', 'STRING', 'Unique metric record identifier', false, true, [], NULL, CURRENT_TIMESTAMP()),
  ('daily_metrics', 'campaign_id', 'STRING', 'Reference to campaign', false, true, [], 'campaigns.campaign_id', CURRENT_TIMESTAMP()),
  ('daily_metrics', 'date', 'DATE', 'Date of metrics', false, true, [], NULL, CURRENT_TIMESTAMP()),
  ('daily_metrics', 'impressions_encrypted', 'BYTES', 'Encrypted impression count', true, false, [], NULL, CURRENT_TIMESTAMP()),
  ('daily_metrics', 'clicks_encrypted', 'BYTES', 'Encrypted click count', true, false, [], NULL, CURRENT_TIMESTAMP()),
  ('daily_metrics', 'spend_encrypted', 'BYTES', 'Encrypted spend amount', true, false, [], NULL, CURRENT_TIMESTAMP()),
  ('daily_metrics', 'conversions_encrypted', 'BYTES', 'Encrypted conversion count', true, false, [], NULL, CURRENT_TIMESTAMP()),
  ('daily_metrics', 'revenue_encrypted', 'BYTES', 'Encrypted revenue amount', true, false, [], NULL, CURRENT_TIMESTAMP()),
  ('daily_metrics', 'channel', 'STRING', 'Marketing channel', false, true, ['search', 'social', 'display', 'video'], NULL, CURRENT_TIMESTAMP());
"
```

---

## 5. Cloud KMS Setup

### Create Key Ring

```bash
# Create key ring for analytics keys
gcloud kms keyrings create analytics \
  --location=us \
  --project=$PROJECT_ID
```

### Create Encryption Keys

```bash
# Create DEK (Data Encryption Key)
gcloud kms keys create data-encryption-key \
  --location=us \
  --keyring=analytics \
  --purpose=encryption \
  --protection-level=hsm \
  --rotation-period=90d \
  --project=$PROJECT_ID

# Create KEK (Key Encryption Key)
gcloud kms keys create kek-encryption-key \
  --location=us \
  --keyring=analytics \
  --purpose=encryption \
  --protection-level=hsm \
  --rotation-period=90d \
  --project=$PROJECT_ID

# List keys
gcloud kms keys list --location=us --keyring=analytics --project=$PROJECT_ID
```

### Set IAM Permissions for KMS

```bash
# Grant service account access to keys
gcloud kms keys add-iam-policy-binding data-encryption-key \
  --location=us \
  --keyring=analytics \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter" \
  --project=$PROJECT_ID

gcloud kms keys add-iam-policy-binding kek-encryption-key \
  --location=us \
  --keyring=analytics \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter" \
  --project=$PROJECT_ID
```

---

## 6. Cloud Storage Setup

### Create Bucket

```bash
# Create bucket for exports
export BUCKET_NAME="$PROJECT_ID-exports"

gcloud storage buckets create gs://$BUCKET_NAME \
  --location=US \
  --uniform-bucket-level-access \
  --project=$PROJECT_ID

# Set lifecycle policy (delete files after 30 days)
cat > /tmp/lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 30}
      }
    ]
  }
}
EOF

gcloud storage buckets update gs://$BUCKET_NAME \
  --lifecycle-file=/tmp/lifecycle.json

# Grant service account access
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.objectAdmin"
```

---

## 7. Secret Manager Setup

### Store Secrets

```bash
# Store OpenAI API key (replace with your actual key)
export OPENAI_API_KEY="sk-..."

echo -n "$OPENAI_API_KEY" | gcloud secrets create openai-api-key \
  --data-file=- \
  --project=$PROJECT_ID

# Store JWT secret
export JWT_SECRET="$(openssl rand -base64 32)"

echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret \
  --data-file=- \
  --project=$PROJECT_ID

# Grant service account access to secrets
gcloud secrets add-iam-policy-binding openai-api-key \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID

gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID
```

---

## 8. Network Configuration

### VPC Service Controls (Optional but Recommended)

```bash
# Create access policy (if not exists)
# gcloud access-context-manager policies create \
#   --organization=YOUR_ORG_ID \
#   --title="Analytics Policy"

# Create service perimeter (advanced setup)
# This restricts data exfiltration
```

### Cloud Armor Security Policy

```bash
# Create security policy
gcloud compute security-policies create analytics-bot-policy \
  --description="Security policy for Analytics Bot"

# Add rules
gcloud compute security-policies rules create 1000 \
  --security-policy=analytics-bot-policy \
  --expression="true" \
  --action="allow"
```

---

## 9. Verification

### Verify BigQuery

```bash
# List datasets
bq ls

# List tables in dataset
bq ls campaign_analytics

# Test query
bq query --use_legacy_sql=false "SELECT COUNT(*) as table_count FROM \`$PROJECT_ID.campaign_analytics.INFORMATION_SCHEMA.TABLES\`"
```

### Verify KMS

```bash
# List keys
gcloud kms keys list --location=us --keyring=analytics

# Test encryption
echo "test" | gcloud kms encrypt \
  --location=us \
  --keyring=analytics \
  --key=data-encryption-key \
  --plaintext-file=- \
  --ciphertext-file=/tmp/encrypted.txt

# Test decryption
gcloud kms decrypt \
  --location=us \
  --keyring=analytics \
  --key=data-encryption-key \
  --ciphertext-file=/tmp/encrypted.txt \
  --plaintext-file=-
```

### Verify Storage

```bash
# List bucket contents
gcloud storage ls gs://$BUCKET_NAME

# Test upload
echo "test file" > /tmp/test.txt
gcloud storage cp /tmp/test.txt gs://$BUCKET_NAME/
gcloud storage ls gs://$BUCKET_NAME/
gcloud storage rm gs://$BUCKET_NAME/test.txt
```

### Verify Service Account

```bash
# Test authentication
gcloud auth activate-service-account $SA_EMAIL \
  --key-file=$GOOGLE_APPLICATION_CREDENTIALS

# Verify access
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:$SA_EMAIL"
```

---

## Environment Variables

Add these to your `.env` file:

```bash
# GCP Configuration
GCP_PROJECT_ID=$PROJECT_ID
GCP_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=$GOOGLE_APPLICATION_CREDENTIALS

# BigQuery
BIGQUERY_DATASET=campaign_analytics
BIGQUERY_LOCATION=US

# KMS
KMS_KEYRING=analytics
KMS_KEY_NAME=data-encryption-key
KMS_LOCATION=us
KEK_NAME=kek-encryption-key

# Storage
STORAGE_BUCKET=$BUCKET_NAME

# Secrets (these will be fetched from Secret Manager)
# OPENAI_API_KEY=...
# JWT_SECRET=...
```

---

## Troubleshooting

### Permission Denied Errors

```bash
# Verify service account has correct permissions
gcloud projects get-iam-policy $PROJECT_ID --format=json | grep -A 5 $SA_EMAIL

# Add missing permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/owner"  # Temporary for debugging
```

### API Not Enabled

```bash
# Check enabled APIs
gcloud services list --enabled | grep -E "(bigquery|kms|storage|secretmanager)"

# Enable missing APIs
gcloud services enable [API_NAME]
```

### Key Not Found

```bash
# List all keys
gcloud kms keys list --location=us --keyring=analytics

# Verify key exists
gcloud kms keys describe data-encryption-key \
  --location=us \
  --keyring=analytics
```

---

## Next Steps

1. **Load Sample Data**: Use `scripts/load-sample-data.js` to populate tables
2. **Deploy Application**: Follow `DEPLOYMENT.md` for deployment instructions
3. **Configure Monitoring**: Set up Cloud Monitoring alerts
4. **Test Queries**: Use the chat interface to test natural language queries

---

## Cost Optimization Tips

1. **BigQuery**: Use partitioned tables, query only needed partitions
2. **Cloud Run**: Set min instances to 0 for dev environments
3. **Cloud KMS**: Batch encryption operations when possible
4. **Storage**: Set lifecycle policies to auto-delete old exports
5. **Monitoring**: Set up billing alerts to track costs

---

## Security Checklist

- [ ] Service account has minimal required permissions
- [ ] KMS keys use HSM protection level
- [ ] Key rotation policy is enabled
- [ ] VPC Service Controls configured (if applicable)
- [ ] Cloud Armor policies applied
- [ ] Audit logging enabled
- [ ] Data retention policies set
- [ ] Secrets stored in Secret Manager
- [ ] No hardcoded credentials in code
- [ ] CORS configured correctly
