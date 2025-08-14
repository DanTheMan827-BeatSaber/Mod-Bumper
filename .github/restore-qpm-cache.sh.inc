source "$(dirname "${BASH_SOURCE[0]}")/ensure-qpm-repo-json.sh.inc"

restore-qpm-cache() {
    local CACHE_DIR="$HOME/.local/share/QPM-RS/cache"
    local QPM_REPO_PATH="$HOME/.config/QPM-RS/qpm.repository.json"
    local MOVE_ITEM=false
    # parse optional --rm flag

    for arg in "$@"; do
        case "$arg" in
            --mv) MOVE_ITEM=true ;;
            *) ITEM_PATH="$arg" ;;
        esac
    done

    if [ -z "$ITEM_PATH" ]; then
        echo "Usage: restore-qpm-cache <item-path>"
        return 1
    fi

    local PACKAGE_JSON_PATH="$ITEM_PATH/qpm.package.json"

    if [[ ! -d "$ITEM_PATH" ]]; then
        echo "Item path does not exist: $ITEM_PATH"
        return 1
    fi

    if [[ ! -f "$PACKAGE_JSON_PATH" ]]; then
        echo "qpm.package.json not found in: $ITEM_PATH"
        return 1
    fi

    ensure-qpm-repo-json

    local ID="$(jq -r '.config.info.id' "$PACKAGE_JSON_PATH")"
    local VERSION="$(jq -r '.config.info.version' "$PACKAGE_JSON_PATH")"

    # Copy the item to $CACHE_DIR/$ID/$VERSION if it doesn't already exist
    local DEST_DIR="$CACHE_DIR/$ID/$VERSION"

    if [[ -d "$DEST_DIR" ]]; then
        echo "Cache already exists for $ID version $VERSION at $DEST_DIR"
    else
        echo "Restoring cache for $ID version $VERSION to $DEST_DIR"
        mkdir -p "$CACHE_DIR/$ID"

        local TEMP_FILE="$(mktemp)"
        jq --arg id "$ID" --arg version "$VERSION" --argjson config "$(cat "$PACKAGE_JSON_PATH")" \
            '
                .artifacts[$id] = (.artifacts[$id] // {}) |
                .artifacts[$id][$version] = $config
            ' "$QPM_REPO_PATH" > "$TEMP_FILE" && mv "$TEMP_FILE" "$QPM_REPO_PATH"
        
        if [ "$MOVE_ITEM" = true ]; then
            mv "$ITEM_PATH" "$DEST_DIR"
        else
            cp -r "$ITEM_PATH" "$DEST_DIR"
        fi

        echo "Cache restored successfully."
    fi
}