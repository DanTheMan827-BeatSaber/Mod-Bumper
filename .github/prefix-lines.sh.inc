prefix-lines() {
    local PREFIX="$1"
    if [[ -z "$PREFIX" ]]; then
        echo "Usage: prefix-lines <prefix>" >&2
        return 1
    fi

    while IFS= read -r line; do
        printf '%s%s\n' "$PREFIX" "$line"
    done
}
