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

# Update CODESPACE.md dulu
echo -e "${GREEN}[0/3]${NC} Updating CODESPACE.md..."
python3 << 'PYEOF'
import subprocess, datetime, re

def run(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.DEVNULL).strip()
    except:
        return ""

try:
    with open('CODESPACE.md', 'r') as f:
        content = f.read()

    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    last_commit = run("git log -1 --pretty='%h — %s (%ad)' --date=format:'%Y-%m-%d'")
    fe_commit   = run("cd frontend && git log -1 --pretty='%h — %s'")
    fev_commit  = run("cd frontend-vendor && git log -1 --pretty='%h — %s'")

    content = re.sub(r'> Generated: .*', f'> Generated: {now}', content)
    content = re.sub(r'\| Last Commit \| .* \|', f'| Last Commit | {last_commit} |', content)
    content = re.sub(r'(\| frontend \| `main` \| ).*( \|)', f'\\g<1>{fe_commit}\\2', content)
    content = re.sub(r'(\| frontend-vendor \| `main` \| ).*( \|)', f'\\g<1>{fev_commit}\\2', content)

    with open('CODESPACE.md', 'w') as f:
        f.write(content)

    print("  ✓ CODESPACE.md updated")
except Exception as e:
    print(f"  ℹ CODESPACE.md skip: {e}")
PYEOF

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
echo -e "${GREEN}✓ All saved & pushed!${NC}"
echo -e "Message: ${YELLOW}$MSG${NC}"
