source "$(dirname "${BASH_SOURCE[0]}")/get-artifacts.sh.inc"
source "$(dirname "${BASH_SOURCE[0]}")/show-qpm-cache.sh.inc"

qpm-prep-cache() {
    local RM_EXISTING=false
    # parse optional --rm flag
    for arg in "$@"; do
        case "$arg" in
            --rm) RM_EXISTING=true ;;
        esac
    done

    local CACHE_DIR="$HOME/.local/share/QPM-RS/cache"
    local QPM_REPO_PATH="$HOME/.config/QPM-RS/qpm.repository.json"
    local QPM_REPO_JSON="$(cat "$QPM_REPO_PATH")"
    local ARTIFACT_PREFIX="qpm-"
    local ARTIFACTS="$(get-artifacts)"
    local QPM_CACHE_ITEMS="$(show-qpm-cache)"
    local QPM_CACHE_ARTIFACTS="$(show-qpm-cache @ | prefix-lines "$ARTIFACT_PREFIX")"

    while IFS=/ read -r NAME VERSION; do
        local ARTIFACT_NAME="$ARTIFACT_PREFIX$NAME@$VERSION"
        local PACKAGE_JSON="$CACHE_DIR/$NAME/$VERSION/qpm.package.json"
        
        # If the artifact name exists in $ARTIFACTS, continue
        if echo "$ARTIFACTS" | grep -q "$ARTIFACT_NAME"; then
            # Remove existing directory if --rm is specified
            if [[ "$RM_EXISTING" == true ]]; then
                local DIR_TO_REMOVE="$CACHE_DIR/$NAME/$VERSION"
                if [[ -d "$DIR_TO_REMOVE" ]]; then
                    echo "Removing existing artifact directory: $DIR_TO_REMOVE" >&2
                    rm -rf "$DIR_TO_REMOVE"
                fi
            fi
            continue
        fi

        # Use jq to extract .artifacts.$NAME.$VERSION from the json
        local ARTIFACT_METADATA="$(jq -r --arg name "$NAME" --arg version "$VERSION" '.artifacts[$name][$version]' <<< "$QPM_REPO_JSON")"
        echo "$ARTIFACT_METADATA" > "$PACKAGE_JSON"
        echo "$NAME/$VERSION"
    done <<< "$QPM_CACHE_ITEMS"
}