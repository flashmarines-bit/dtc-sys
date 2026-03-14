#!/bin/bash

SOLUTION="Dtc.slnx"
API_PROJECT="src/Dtc.Api/Dtc.Api.csproj"
INFRA_PROJECT="src/Dtc.Infrastructure/Dtc.Infrastructure.csproj"
EF_ARGS="--project $INFRA_PROJECT --startup-project $API_PROJECT"

case "$1" in
  up)
    echo "Starting DTC API..."
    cd src/Dtc.Api && dotnet run
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
    echo ".NET version: $(dotnet --version)"
    echo "EF version: $(dotnet ef --version)"
    echo "Solution: $(ls *.slnx 2>/dev/null || echo 'NOT FOUND')"
    echo "Projects:"
    ls src/
    ;;
  *)
    echo "DTC Dev CLI"
    echo ""
    echo "Commands:"
    echo "  dev up                  Start API"
    echo "  dev build               Build solution"
    echo "  dev migrate             Apply pending migrations"
    echo "  dev migration [name]    Create new migration"
    echo "  dev migrations-list     List all migrations"
    echo "  dev doctor              Check environment"
    ;;
esac
