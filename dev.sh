#!/bin/bash

SOLUTION="Dtc.slnx"
API_PROJECT="src/Dtc.Api/Dtc.Api.csproj"
INFRA_PROJECT="src/Dtc.Infrastructure/Dtc.Infrastructure.csproj"
EF_ARGS="--project $INFRA_PROJECT --startup-project $API_PROJECT"
CODESPACE_NAME="cuddly-enigma-69667jq5vvgq24gp9"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

publish_ports() {
  echo ""
  echo -e "${YELLOW}Setting up port forwarding...${NC}"
  for port in 5000 3000 4000; do
    gh codespace ports visibility $port:public -c $CODESPACE_NAME 2>/dev/null \
      && echo -e "  ${GREEN}✓${NC} Port $port → public" \
      || echo -e "  ${YELLOW}ℹ${NC} Port $port → set manual via Ports tab"
  done
}

kill_port() {
  local port=$1
  local pid
  pid=$(lsof -ti tcp:$port 2>/dev/null || true)
  if [ -n "$pid" ]; then
    echo -e "  ${YELLOW}↺${NC} Port $port aktif (PID $pid), stopping..."
    kill -15 $pid 2>/dev/null || true
    sleep 2
    # Kalau masih hidup, force kill
    pid=$(lsof -ti tcp:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
      kill -9 $pid 2>/dev/null || true
      sleep 1
    fi
    # Verifikasi sudah mati
    pid=$(lsof -ti tcp:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
      echo -e "  ${RED}✗${NC} Port $port gagal dibebaskan, coba manual: kill -9 $pid"
      return 1
    else
      echo -e "  ${GREEN}✓${NC} Port $port berhasil dibebaskan"
    fi
  else
    echo -e "  ${GREEN}✓${NC} Port $port bebas"
  fi
}

kill_all_ports() {
  echo -e "${YELLOW}Memeriksa port yang aktif...${NC}"
  kill_port 5000
  kill_port 3000
  kill_port 4000
  sleep 1
}

wait_for_port() {
  local port=$1
  local name=$2
  local retries=60
  echo -ne "  Menunggu $name (port $port)"
  for i in $(seq 1 $retries); do
    if lsof -ti tcp:$port > /dev/null 2>&1; then
      echo -e " ${GREEN}✓ ready${NC}"
      return 0
    fi
    echo -n "."
    sleep 2
  done
  echo -e " ${RED}✗ timeout — cek logs${NC}"
  return 1
}

case "$1" in

  all)
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}  DTC System — Starting All Services  ${NC}"
    echo -e "${GREEN}======================================${NC}"
    echo ""

    kill_all_ports
    mkdir -p logs

    echo ""
    echo -e "${GREEN}[1/3]${NC} .NET API (port 5000)..."
    (cd src/Dtc.Api && dotnet run --urls "http://0.0.0.0:5000") > logs/api.log 2>&1 &
    echo "      PID: $! | logs/api.log"

    echo -e "${GREEN}[2/3]${NC} Internal Portal (port 3000)..."
    (cd frontend && npm run dev) > logs/frontend.log 2>&1 &
    echo "      PID: $! | logs/frontend.log"

    echo -e "${GREEN}[3/3]${NC} Vendor Portal (port 4000)..."
    (cd frontend-vendor && PORT=4000 npm run dev) > logs/vendor.log 2>&1 &
    echo "      PID: $! | logs/vendor.log"

    echo ""
    echo -e "${YELLOW}Menunggu semua service siap...${NC}"
    wait_for_port 5000 ".NET API"
    wait_for_port 3000 "Internal Portal"
    wait_for_port 4000 "Vendor Portal"

    publish_ports

    echo ""
    echo -e "${GREEN}======================================${NC}"
    echo "  🔌 API      → http://localhost:5000"
    echo "  🖥️  Internal → http://localhost:3000"
    echo "  🏪 Vendor   → http://localhost:4000"
    echo -e "${GREEN}======================================${NC}"
    echo ""
    echo "Logs:"
    echo "  tail -f logs/api.log"
    echo "  tail -f logs/frontend.log"
    echo "  tail -f logs/vendor.log"
    echo ""
    echo -e "Stop semua: ${RED}bash dev.sh stop${NC}"
    ;;

  restart)
    echo -e "${YELLOW}Restarting all services...${NC}"
    echo ""
    kill_all_ports
    mkdir -p logs

    echo ""
    echo -e "${GREEN}[1/3]${NC} .NET API (port 5000)..."
    (cd src/Dtc.Api && dotnet run --urls "http://0.0.0.0:5000") > logs/api.log 2>&1 &
    echo "      PID: $! | logs/api.log"

    echo -e "${GREEN}[2/3]${NC} Internal Portal (port 3000)..."
    (cd frontend && npm run dev) > logs/frontend.log 2>&1 &
    echo "      PID: $! | logs/frontend.log"

    echo -e "${GREEN}[3/3]${NC} Vendor Portal (port 4000)..."
    (cd frontend-vendor && PORT=4000 npm run dev) > logs/vendor.log 2>&1 &
    echo "      PID: $! | logs/vendor.log"

    echo ""
    echo -e "${YELLOW}Menunggu semua service siap...${NC}"
    wait_for_port 5000 ".NET API"
    wait_for_port 3000 "Internal Portal"
    wait_for_port 4000 "Vendor Portal"

    publish_ports

    echo ""
    echo -e "${GREEN}✓ Semua service berhasil direstart${NC}"
    echo ""
    echo "  🔌 API      → http://localhost:5000"
    echo "  🖥️  Internal → http://localhost:3000"
    echo "  🏪 Vendor   → http://localhost:4000"
    ;;

  restart-api)
    echo -e "${YELLOW}Restarting .NET API...${NC}"
    kill_port 5000
    echo -e "${GREEN}Starting .NET API (port 5000)...${NC}"
    (cd src/Dtc.Api && dotnet run --urls "http://0.0.0.0:5000") > logs/api.log 2>&1 &
    echo "PID: $!"
    wait_for_port 5000 ".NET API"
    ;;

  restart-frontend)
    echo -e "${YELLOW}Restarting Internal Portal...${NC}"
    kill_port 3000
    echo -e "${GREEN}Starting Internal Portal (port 3000)...${NC}"
    (cd frontend && npm run dev) > logs/frontend.log 2>&1 &
    echo "PID: $!"
    wait_for_port 3000 "Internal Portal"
    ;;

  restart-vendor)
    echo -e "${YELLOW}Restarting Vendor Portal...${NC}"
    kill_port 4000
    echo -e "${GREEN}Starting Vendor Portal (port 4000)...${NC}"
    (cd frontend-vendor && PORT=4000 npm run dev) > logs/vendor.log 2>&1 &
    echo "PID: $!"
    wait_for_port 4000 "Vendor Portal"
    ;;

  stop)
    echo -e "${RED}Stopping all services...${NC}"
    kill_all_ports
    echo -e "${GREEN}Done.${NC}"
    ;;

  up)
    echo "Starting DTC API (port 5000)..."
    cd src/Dtc.Api && dotnet run --urls "http://0.0.0.0:5000"
    ;;

  frontend)
    echo "Starting Internal Portal (port 3000)..."
    cd frontend && npm run dev
    ;;

  vendor)
    echo "Starting Vendor Portal (port 4000)..."
    cd frontend-vendor && PORT=4000 npm run dev
    ;;

  ports)
    publish_ports
    ;;

  build)
    echo "Building solution..."
    dotnet build $SOLUTION
    ;;

  migrate)
    echo "Running migrations..."
    dotnet ef database update $EF_ARGS
    ;;

  migration)
    NAME=${2:-"Migration_$(date +%Y%m%d%H%M%S)"}
    echo "Creating migration: $NAME"
    dotnet ef migrations add $NAME $EF_ARGS --output-dir Migrations
    ;;

  migrations-list)
    dotnet ef migrations list $EF_ARGS
    ;;

  doctor)
    echo "=== DTC Doctor ==="
    echo ".NET  : $(dotnet --version)"
    echo "EF    : $(dotnet ef --version)"
    echo "Node  : $(node --version)"
    echo "npm   : $(npm --version)"
    echo "Solution: $(ls *.slnx 2>/dev/null || echo 'NOT FOUND')"
    echo ""
    echo "Projects:"
    ls src/
    ;;

  *)
    echo ""
    echo "DTC Dev CLI"
    echo ""
    echo -e "${GREEN}Usage: bash dev.sh [command]${NC}"
    echo ""
    echo "Commands:"
    echo "  all              Start semua service + publish ports"
    echo "  stop             Stop semua service"
    echo "  restart          Restart semua service"
    echo "  restart-api      Restart API only"
    echo "  restart-frontend Restart Internal Portal only"
    echo "  restart-vendor   Restart Vendor Portal only"
    echo "  ports            Publish ports saja"
    echo "  up               Start API only (port 5000)"
    echo "  frontend         Start Internal Portal only (port 3000)"
    echo "  vendor           Start Vendor Portal only (port 4000)"
    echo "  build            Build solution"
    echo "  migrate          Apply pending migrations"
    echo "  migration [name] Create new migration"
    echo "  migrations-list  List all migrations"
    echo "  doctor           Check environment"
    echo ""
    ;;

esac
