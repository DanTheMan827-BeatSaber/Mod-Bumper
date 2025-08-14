get-artifacts() {
    local GITHUB_REPOSITORY="${1:-$GITHUB_REPOSITORY}"
    local RUN_ID="${2:-$RUN_ID}"
    local DIR_SEP="${3:-/}"

    gh api \
        "repos/$GITHUB_REPOSITORY/actions/runs/$RUN_ID/artifacts" \
        --paginate \
        --jq '.artifacts[].name' | sort
}