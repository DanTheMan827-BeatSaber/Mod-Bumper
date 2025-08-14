replace() {
    local SEARCH="$1"
    local REPLACE="$2"

    if [[ -z "$SEARCH" || -z "$REPLACE" ]]; then
        echo "Usage: replace <search> <replace>" >&2
        return 1
    fi

    sed "s|$SEARCH|$REPLACE|g"
}