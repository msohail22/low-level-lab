#!/usr/bin/env bash
set -euo pipefail

# Safe by default: this script only prints the commands it would run.
# Set OPENFGA_API_URL, OPENFGA_STORE_ID and OPENFGA_MODEL_ID (and an OAuth
# token in OPENFGA_BEARER_TOKEN) in your shell. Never place these in source.
API_URL="${OPENFGA_API_URL:?Set OPENFGA_API_URL}"
STORE_ID="${OPENFGA_STORE_ID:-}"
MODEL_FILE="${OPENFGA_MODEL_FILE:-openfga/model.fga}"
APPLY="${OPENFGA_APPLY:-0}"

if [[ ! -f "$MODEL_FILE" ]]; then
	echo "Model file not found: $MODEL_FILE" >&2
	exit 1
fi

echo "fga model test --model-file \"$MODEL_FILE\""
if [[ "$APPLY" != "1" ]]; then
	echo "Dry run only. Set OPENFGA_APPLY=1 to write the model."
	exit 0
fi

: "${STORE_ID:?Set OPENFGA_STORE_ID for an explicit apply}"
command -v fga >/dev/null || { echo "Install the OpenFGA CLI before applying." >&2; exit 1; }
export FGA_API_URL="$API_URL"
fga model write --store-id "$STORE_ID" --file "$MODEL_FILE"

if [[ "${OPENFGA_WRITE_TUPLE:-0}" == "1" ]]; then
	: "${OPENFGA_USER_ID:?Set OPENFGA_USER_ID explicitly to write a tuple}"
	: "${OPENFGA_RELATION:?Set OPENFGA_RELATION explicitly to write a tuple}"
	: "${OPENFGA_OBJECT:?Set OPENFGA_OBJECT explicitly to write a tuple}"
	fga tuple write --store-id "$STORE_ID" \
		"user:${OPENFGA_USER_ID}#${OPENFGA_RELATION}@${OPENFGA_OBJECT}"
else
	echo "No tuples written. Set OPENFGA_WRITE_TUPLE=1 plus explicit tuple values to opt in."
fi
