#!/bin/bash
set -e

echo "╔════════════════════════════════════════╗"
echo "║     DTC System — Setup Wizard          ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check requirements
echo "🔍 Checking requirements..."
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not found. Please install Docker."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || docker compose version >/dev/null 2>&1 || { echo "❌ Docker Compose not found."; exit 1; }
echo "✅ Docker found"

# Collect config
read -p "📌 Enter your domain or IP (e.g. dtc.company.com): " DOMAIN
read -p "💾 Storage provider [minio/local] (default: minio): " STORAGE
STORAGE=${STORAGE:-minio}
read -p "📧 SMTP Email: " SMTP_EMAIL
read -s -p "🔑 SMTP App Password: " SMTP_PASS
echo ""
read -p "👤 Admin email: " ADMIN_EMAIL
read -s -p "🔑 Admin password: " ADMIN_PASS
echo ""

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
DB_PASS=$(openssl rand -base64 16 | tr -d '/+=')
MINIO_SECRET=$(openssl rand -base64 16 | tr -d '/+=')

# Write .env.production
cat > .env.production << EOF
DB_NAME=dtc_production
DB_USER=dtc_user
DB_PASSWORD=${DB_PASS}
DB_HOST=postgres
DB_PORT=5432
JWT_SECRET=${JWT_SECRET}
Storage__Provider=${STORAGE}
Storage__Minio__Endpoint=minio:9000
Storage__Minio__AccessKey=dtc_minio
Storage__Minio__SecretKey=${MINIO_SECRET}
Storage__Minio__Bucket=dtc-storage
Storage__Minio__UseSSL=false
Email__SmtpServer=smtp.gmail.com
Email__SmtpPort=587
Email__SenderEmail=${SMTP_EMAIL}
Email__SenderName=DTC System
Email__AppPassword=${SMTP_PASS}
OcrService__BaseUrl=http://ocr:8000
ASPNETCORE_URLS=http://+:5000
EOF

cat > .env.frontend.production << EOF
NEXT_PUBLIC_API_URL=http://${DOMAIN}
EOF

echo ""
echo "🚀 Starting DTC System..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "✅ DTC System ready!"
echo "   URL: http://${DOMAIN}"
echo "   Admin: ${ADMIN_EMAIL}"
echo ""
echo "⚠️  Save these credentials:"
echo "   DB Password: ${DB_PASS}"
echo "   JWT Secret: ${JWT_SECRET}"
