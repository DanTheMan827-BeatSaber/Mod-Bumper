ensure-qpm-repo-json() {
    local QPM_REPO_PATH="$HOME/.config/QPM-RS/qpm.repository.json"
    if [[ ! -f "$QPM_REPO_PATH" ]]; then
        mkdir -p "$(dirname "$QPM_REPO_PATH")"
        jq -n \
            --arg schema "https://raw.githubusercontent.com/QuestPackageManager/QPM.CLI/refs/heads/main/qpm.repository.schema.json" \
            '{ "$schema": $schema, artifacts: {} }' > "$QPM_REPO_PATH"
        echo "Created QPM repository file at $QPM_REPO_PATH"
    fi
}