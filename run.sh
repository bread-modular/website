#!/usr/bin/env bash
# run.sh — production build + start in one command.
#   1. frees the target port (default 3000) by killing whatever listens on it
#   2. npm run build
#   3. npm start on that port
#
# Usage:  ./run.sh            # build + start on port 3000
#         PORT=4000 ./run.sh  # any other port
#         SKIP_BUILD=1 ./run.sh
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

PORT="${PORT:-3000}"
# NB: do not read $HOSTNAME here — bash sets it to the machine name, which would
# bind next start to 127.0.1.1 instead of all interfaces.
BIND_HOST="${BIND_HOST:-0.0.0.0}"
SKIP_BUILD="${SKIP_BUILD:-0}"

log() { printf '==> %s\n' "$*"; }
die() { printf '!!  %s\n' "$*" >&2; exit 1; }

# Print PIDs listening on $PORT (best effort, several backends).
list_pids() {
    local pids=""
    if command -v lsof >/dev/null 2>&1; then
        pids="$(lsof -ti "tcp:${PORT}" -sTCP:LISTEN 2>/dev/null || true)"
    fi
    if [ -z "$pids" ] && command -v ss >/dev/null 2>&1; then
        pids="$(ss -ltnpH "sport = :${PORT}" 2>/dev/null \
            | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u || true)"
    fi
    printf '%s' "$pids"
}

# Kill everything listening on $PORT: TERM first, KILL if it lingers.
kill_port() {
    local pids still
    pids="$(list_pids)"

    if [ -z "$pids" ] && command -v fuser >/dev/null 2>&1; then
        fuser -k "${PORT}/tcp" >/dev/null 2>&1 || true
        pids="$(list_pids)"
    fi

    if [ -z "$pids" ]; then
        log "Port ${PORT} is free."
        return 0
    fi

    log "Killing process(es) on port ${PORT}: $(echo $pids | tr '\n' ' ')"
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true

    local i=0
    while [ "$i" -lt 10 ]; do
        sleep 0.5
        still="$(list_pids)"
        [ -n "$still" ] || { log "Port ${PORT} is free."; return 0; }
        i=$((i + 1))
    done

    log "Force killing stubborn process(es): $(echo $still | tr '\n' ' ')"
    # shellcheck disable=SC2086
    kill -9 $still 2>/dev/null || true
    sleep 0.5
    [ -z "$(list_pids)" ] || die "Port ${PORT} is still in use after SIGKILL."
    log "Port ${PORT} is free."
}

[ -f package.json ] || die "No package.json here — run this from the project root."

if [ ! -d node_modules ]; then
    log "node_modules missing, installing dependencies (npm ci)…"
    if [ -f package-lock.json ]; then npm ci; else npm install; fi
fi

# Free the port BEFORE building, so a stale server can never shadow the new one.
kill_port

if [ "$SKIP_BUILD" = "1" ]; then
    log "SKIP_BUILD=1 — skipping npm run build."
else
    log "Building (npm run build)…"
    npm run build
fi

log "Starting http://${BIND_HOST}:${PORT}…"
exec npm start -- --hostname "$BIND_HOST" --port "$PORT"
