#!/bin/bash

API_URL=${1:-http://localhost:5000}

echo "╔════════════════════════════════════════╗"
echo "║     DTC System — Health Check          ║"
echo "╚════════════════════════════════════════╝"

check() {
  local name=$1
  local cmd=$2
  if eval "$cmd" > /dev/null 2>&1; then
    echo "✅ $name"
  else
    echo "❌ $name"
  fi
}

echo ""
echo "🔍 Services:"
check "API Health"      "curl -sf ${API_URL}/health"
check "Frontend"        "curl -sf http://localhost:3000"
check "OCR Service"     "curl -sf http://localhost:8000/health"
check "PostgreSQL"      "pg_isready -h localhost -p 5432 2>/dev/null || docker exec dtc-postgres-1 pg_isready"
check "MinIO"           "curl -sf http://localhost:9000/minio/health/live"

echo ""
echo "📊 API Details:"
HEALTH=$(curl -sf ${API_URL}/health 2>/dev/null)
if [ ! -z "$HEALTH" ]; then
  echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
fi
