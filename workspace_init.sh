#!/usr/bin/env bash
# workspace_init.sh — runs automatically when a new workspace is created.
#   $1 = original project directory (the main repo checkout)
#
# Copy ALL initialized submodules, including opt/ footprint libraries, from the
# original checkout. No clone, fetch, or network fallback. Copy Git metadata too
# so each workspace owns its files, index and objects (never reuse a .git link
# pointing at the original checkout). Compatible with macOS Bash 3.2.
#
# Afterwards, make the workspace runnable: install JS dependencies when
# node_modules is missing or stale relative to package-lock.json.
# Skip that step with SKIP_NPM=1.

set -euo pipefail

ORIGINAL_DIR="${1:-}"
if [ -n "$ORIGINAL_DIR" ]; then
    ORIGINAL_DIR="$(cd -- "$ORIGINAL_DIR" && pwd -P)"
fi
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
cd "$SCRIPT_DIR"

log() { printf '==> %s\n' "$*"; }
die() { printf '!!  %s\n' "$*" >&2; exit 1; }

# A failed/interrupted copy must not look initialized on the next invocation.
staging=""
trap '[ -z "$staging" ] || rm -rf -- "$staging"' EXIT

copy_submodules() {
    [ -f .gitmodules ] || { log "No submodules to copy."; return 0; }

    local paths
    if paths="$(git config -f .gitmodules --get-regexp '^submodule\..*\.path$')"; then
        paths="$(printf '%s\n' "$paths" | sed 's/^[^ ]* //')"
    else
        local status=$?
        [ "$status" -eq 1 ] || die "Cannot read submodule paths from .gitmodules."
        log "No submodules to copy."
        return 0
    fi

    local path source source_git_dir
    while IFS= read -r path; do
        [ -n "$path" ] || continue
        if [ -e "$path/.git" ]; then
            git -C "$path" rev-parse --verify HEAD >/dev/null 2>&1 \
                || die "Invalid existing checkout: $path (left untouched)."
            log "Already initialized: $path"
            continue
        fi

        [ -n "$ORIGINAL_DIR" ] && [ -e "$ORIGINAL_DIR/$path/.git" ] \
            || die "No initialized local copy of '$path'. Initialize it in the original checkout first, then rerun: $0 /path/to/original. No network fallback."
        source="$ORIGINAL_DIR/$path"
        source_git_dir="$(git -C "$source" rev-parse --absolute-git-dir)"
        git -C "$source" rev-parse --verify HEAD >/dev/null

        # The project's submodules are ordinary independent checkouts. Do not copy
        # metadata that would silently retain dependencies on a different checkout.
        [ ! -f "$source_git_dir/commondir" ] \
            || die "'$path' is a linked worktree; use an independent local submodule checkout as the source."
        [ ! -s "$source_git_dir/objects/info/alternates" ] \
            || die "'$path' borrows Git objects; dissociate the source checkout before copying."
        [ ! -L "$path" ] || die "Refusing to replace symlink: $path"
        if [ -e "$path" ]; then
            [ -d "$path" ] && [ -z "$(ls -A -- "$path")" ] \
                || die "Destination '$path' is nonempty but not initialized (left untouched)."
        fi

        log "Copying local submodule: $path"
        mkdir -p -- "$(dirname -- "$path")"
        staging="$(mktemp -d "$SCRIPT_DIR/${path}.workspace-copy.XXXXXX")"
        cp -Rp -- "$source/." "$staging/"
        # Submodule .git files contain paths relative to the ORIGINAL checkout.
        # Replace those with a private directory, not a shared gitdir or hardlinks.
        if [ ! -d "$staging/.git" ] || [ -L "$staging/.git" ]; then
            rm -f -- "$staging/.git"
            cp -Rp -- "$source_git_dir" "$staging/.git"
        fi
        git config --file "$staging/.git/config" core.worktree ..
        git -C "$staging" rev-parse --verify HEAD >/dev/null
        [ ! -d "$path" ] || rmdir -- "$path"
        mv -- "$staging" "$path"
        staging=""
    done <<< "$paths"

    log "All submodules ready (local copies only)."
}

install_node_deps() {
    [ -f package.json ] || { log "No package.json; skipping JS dependencies."; return 0; }

    if [ "${SKIP_NPM:-0}" = "1" ]; then
        log "SKIP_NPM=1; skipping JS dependencies."
        return 0
    fi

    if ! command -v npm >/dev/null 2>&1; then
        log "npm not found in PATH; skipping JS dependencies."
        return 0
    fi

    local marker="$SCRIPT_DIR/node_modules/.package-lock.json"
    if [ -d "$SCRIPT_DIR/node_modules" ] && [ -f "$marker" ]; then
        if [ ! -f "$SCRIPT_DIR/package-lock.json" ] \
            || [ "$SCRIPT_DIR/package-lock.json" -nt "$marker" ]; then
            log "node_modules is stale (package-lock.json is newer)."
        else
            log "JS dependencies already installed."
            return 0
        fi
    fi

    log "Installing JS dependencies (node_modules in workspace)…"
    if [ -f "$SCRIPT_DIR/package-lock.json" ]; then
        npm ci --no-audit --no-fund --prefix "$SCRIPT_DIR"
    else
        npm install --no-audit --no-fund --prefix "$SCRIPT_DIR"
    fi
    log "JS dependencies ready."
}

copy_submodules
install_node_deps

log "Workspace ready."
