# dtc-sys
document-trackaction-control


pkill -f "dotnet.*Dtc.Api" 2>/dev/null
pkill -f "next" 2>/dev/null
sleep 2

export Supabase__ServiceKey="sb_secret_goHG94ZR3Ah4zGSc0l716A_3hsGT20l" && \
cd /workspaces/dtc-sys && dotnet run --project src/Dtc.Api --urls "http://localhost:5000" > /tmp/api.log 2>&1 &

cd /workspaces/dtc-sys/frontend && npm run dev > /tmp/next.log 2>&1 &

until curl -s http://localhost:5000/health > /dev/null 2>&1; do sleep 2; done && \
gh codespace ports visibility 5000:public -c $CODESPACE_NAME && \
echo "✅ API READY & PUBLIC"

until curl -s http://localhost:3000 > /dev/null 2>&1; do sleep 2; done && \
gh codespace ports visibility 3000:public -c $CODESPACE_NAME && \
echo "✅ FRONTEND READY & PUBLIC"