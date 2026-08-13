#!/usr/bin/env bash
# Delete stale GitHub Actions runs that were triggered by the pre-rewrite
# commits (their run pages still show the old Codebuff commit messages).
#
# Usage:
#   GITHUB_TOKEN=ghp_... bash scripts/delete-stale-actions-runs.sh
#   or: bash scripts/delete-stale-actions-runs.sh ghp_...
#
# Requirements:
#   - A GitHub token (fine-grained PAT) with "Actions: Read and write"
#     permission on this repository.
#   - curl (usually preinstalled on macOS/Linux).

set -euo pipefail

REPO="Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer"
TOKEN="${GITHUB_TOKEN:-${1:-}}"

if [[ -z "$TOKEN" ]]; then
  echo "❌ No token provided."
  echo "   Set GITHUB_TOKEN in your environment or pass it as the first argument."
  echo "   Create one at: https://github.com/settings/tokens (fine-grained PAT,"
  echo "   repo: $REPO, permission: Actions: Read and write)."
  exit 1
fi

# run_id | workflow | old commit
RUNS=(
  "31682845605|CI|e54ef9d"
  "31682845517|Secret Scan|e54ef9d"
  "31682418207|CI|ade4c6d"
)

for entry in "${RUNS[@]}"; do
  IFS='|' read -r run_id workflow commit <<< "$entry"
  printf "Deleting %-12s run %s (commit %s) ... " "$workflow" "$run_id" "$commit"

  status=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$REPO/actions/runs/$run_id")

  if [[ "$status" == "204" ]]; then
    echo "✅ deleted"
  else
    echo "❌ failed (HTTP $status)"
    echo "   Check that your token has 'Actions: Read and write' on $REPO."
    exit 1
  fi
done

echo
echo "Done. Verify in the Actions tab — the three runs should be gone."
echo "Note: run logs (including old commit messages) are deleted with the runs."
