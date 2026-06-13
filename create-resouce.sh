cat << 'EOF' > create-resources.sh
#!/usr/bin/env bash

LOG_FILE="resources-output.txt"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "=== Creating resources for low-level-lab ==="

# KV
echo "---- KV ----"
npx wrangler kv namespace create KV_STORE

# R2
echo "---- R2 ----"
npx wrangler r2 bucket create low-level-lab-bucket

# D1
echo "---- D1 ----"
npx wrangler d1 create low_level_lab_db

# Queues
echo "---- Queues ----"
npx wrangler queues create low-level-lab-queue

# Vectorize
echo "---- Vectorize ----"
npx wrangler vectorize create low-level-lab-index

# AI Gateway
echo "---- AI Gateway ----"
npx wrangler ai gateway create low-level-lab-gateway

# Images
echo "---- Images ----"
npx wrangler images config create

echo "=== Done ==="
EOF

