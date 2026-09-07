#!/usr/bin/env bash
set -euo pipefail
release_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
if [ "${1:-}" = "--check" ]; then
  docker compose --project-directory "$release_dir" config --quiet
  sudo nginx -t
  printf '%s\n' 'ROLLBACK_CHECK_PASS: release compose and host nginx configuration valid.'
  exit 0
fi
if [ "${1:-}" != "--apply" ]; then
  printf '%s\n' 'Usage: rollback-initial.sh --check | --apply'
  exit 2
fi
config=/etc/nginx/sites-available/cattfan.site
expected="$release_dir/deploy/host-nginx.conf"
if [ -f "$config" ]; then
  sudo cmp --silent "$config" "$expected"
  sudo rm -- /etc/nginx/sites-enabled/cattfan.site "$config"
  sudo nginx -t
  sudo systemctl reload nginx
fi
docker compose --project-directory "$release_dir" down
sudo ufw delete allow 18088/tcp
printf '%s\n' 'ROLLBACK_PASS: initial portfolio deployment removed; existing applications retained.'
