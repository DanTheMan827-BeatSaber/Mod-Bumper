show-qpm-cache() {
    local DIR_SEP="/"
    local OUTPUT_JSON=false
    local CACHE_DIR="$HOME/.local/share/QPM-RS/cache"

    # parse arguments
    for arg in "$@"; do
        case "$arg" in
            --json) OUTPUT_JSON=true ;;
            *) DIR_SEP="$arg" ;;
        esac
    done

    if [[ ! -d "$CACHE_DIR" ]]; then
        echo "Cache directory not found: $CACHE_DIR" >&2
        return 1
    fi

    (
        cd "$CACHE_DIR" || return 1
        local entries
        entries=$(printf '%s\n' */* | sed "s|/|${DIR_SEP}|g" | sort)

        if [[ "$OUTPUT_JSON" = true ]]; then
            printf '%s\n' "$entries" | jq -Rsc 'split("\n") | map(select(length > 0))'
        else
            printf '%s\n' "$entries"
        fi
    )
}