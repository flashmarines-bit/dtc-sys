#!/bin/bash
set -e

BACKUP_DIR=${BACKUP_DIR:-./backups}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="dtc-backup-${TIMESTAMP}"

echo "╔════════════════════════════════════════╗"
echo "║     DTC System — Backup                ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "📦 Creating backup: ${BACKUP_NAME}"

mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# Backup PostgreSQL
echo "💾 Backing up database..."
docker exec $(docker ps -qf "name=postgres") \
  pg_dump -U dtc_user dtc_production \
  > "${BACKUP_DIR}/${BACKUP_NAME}/database.sql"
gzip "${BACKUP_DIR}/${BACKUP_NAME}/database.sql"
echo "  ✅ Database backup complete"

# Backup config
echo "⚙️  Backing up config..."
cp .env.production "${BACKUP_DIR}/${BACKUP_NAME}/" 2>/dev/null || true
cp docker-compose.prod.yml "${BACKUP_DIR}/${BACKUP_NAME}/" 2>/dev/null || true
echo "  ✅ Config backup complete"

# Create archive
echo "🗜️  Compressing..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
  -C "${BACKUP_DIR}" "${BACKUP_NAME}"
rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"

# Checksum
CHECKSUM=$(sha256sum "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -d' ' -f1)
echo "${CHECKSUM}" > "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz.sha256"

echo ""
echo "✅ Backup complete!"
echo "   File: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo "   SHA256: ${CHECKSUM}"
