#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

MSG=${1:-"chore: save progress $(date '+%Y-%m-%d %H:%M')"}

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  DTC System — Save & Push            ${NC}"
echo -e "${GREEN}======================================${NC}"
echo -e "Message: ${YELLOW}$MSG${NC}"
echo ""

# Submodule: frontend
echo -e "${GREEN}[1/3]${NC} frontend (Internal Portal)..."
cd frontend
if [ -n "$(git status --porcelain)" ]; then
  git add -A && git commit -m "$MSG" && git push origin HEAD \
    && echo -e "  ${GREEN}✓ pushed${NC}" \
    || echo -e "  ${RED}✗ push failed${NC}"
else
  echo -e "  ${YELLOW}ℹ no changes${NC}"
fi
cd ..

# Submodule: frontend-vendor
echo -e "${GREEN}[2/3]${NC} frontend-vendor (Vendor Portal)..."
cd frontend-vendor
if [ -n "$(git status --porcelain)" ]; then
  git add -A && git commit -m "$MSG" && git push origin HEAD \
    && echo -e "  ${GREEN}✓ pushed${NC}" \
    || echo -e "  ${RED}✗ push failed${NC}"
else
  echo -e "  ${YELLOW}ℹ no changes${NC}"
fi
cd ..

# Root repo
echo -e "${GREEN}[3/3]${NC} root repo (dtc-sys)..."
if [ -n "$(git status --porcelain)" ]; then
  git add -A && git commit -m "$MSG" && git push origin main \
    && echo -e "  ${GREEN}✓ pushed${NC}" \
    || echo -e "  ${RED}✗ push failed${NC}"
else
  echo -e "  ${YELLOW}ℹ no changes${NC}"
fi

echo ""
echo -e "${GREEN}✓ Done!${NC}"
