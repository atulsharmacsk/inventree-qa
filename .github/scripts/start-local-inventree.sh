#!/usr/bin/env bash
# Starts a throwaway InvenTree on http://localhost for ENV=LOCALHOST CI runs, using InvenTree's own docker compose recipe.
# Exports LOCAL_SUPERUSER_* and LOCAL_READER_* credentials (generated and masked per run) and INVENTREE_COMPOSE_DIR to later steps.
set -euo pipefail

version="${INVENTREE_VERSION:?Set INVENTREE_VERSION, for example 1.6.3}"
dir="${RUNNER_TEMP:-/tmp}/inventree"
mkdir -p "$dir"
cd "$dir"

source_url="https://raw.githubusercontent.com/inventree/InvenTree/${version}/contrib/container"
curl -fsSL "$source_url/docker-compose.yml" -o docker-compose.yml
curl -fsSL "$source_url/Caddyfile" -o Caddyfile

admin_user="ci-admin"
admin_password="$(openssl rand -hex 16)"
db_password="$(openssl rand -hex 16)"
echo "::add-mask::$admin_password"
echo "::add-mask::$db_password"

# Same values as the recipe's .env, with a pinned version, generated passwords, and plugins off for a faster start.
cat > .env <<EOF
COMPOSE_PROJECT_NAME=inventree
INVENTREE_TAG=${version}
INVENTREE_SITE_URL=http://localhost
INVENTREE_WEB_PORT=8000
INVENTREE_USE_X_FORWARDED_HOST=True
INVENTREE_USE_X_FORWARDED_PORT=True
INVENTREE_USE_X_FORWARDED_PROTO=True
INVENTREE_EXT_VOLUME=./inventree-data
INVENTREE_LOG_LEVEL=WARNING
INVENTREE_PLUGINS_ENABLED=False
INVENTREE_AUTO_UPDATE=True
INVENTREE_ADMIN_USER=${admin_user}
INVENTREE_ADMIN_PASSWORD=${admin_password}
INVENTREE_ADMIN_EMAIL=ci-admin@example.com
INVENTREE_DB_ENGINE=postgresql
INVENTREE_DB_NAME=inventree
INVENTREE_DB_HOST=inventree-db
INVENTREE_DB_PORT=5432
INVENTREE_DB_USER=pguser
INVENTREE_DB_PASSWORD=${db_password}
INVENTREE_CACHE_ENABLED=True
INVENTREE_CACHE_HOST=inventree-cache
INVENTREE_CACHE_PORT=6379
INVENTREE_GUNICORN_TIMEOUT=90
EOF

docker compose pull --quiet
# Migrations and static files, as in InvenTree's install guide, before the stack starts.
docker compose run --rm inventree-server invoke update
docker compose up -d

ready=false
for _ in $(seq 1 60); do
  if curl -fsS -u "$admin_user:$admin_password" http://localhost/api/user/me/ > /dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 5
done
if [ "$ready" != "true" ]; then
  echo "::error::InvenTree did not answer on http://localhost within 5 minutes"
  docker compose ps
  docker compose logs --tail 100 inventree-server
  exit 1
fi

# Match the local reference instance (1.6.3), which the expected results were confirmed on.
for setting in PART_ENABLE_LOCKING=true PART_ALLOW_DUPLICATE_IPN=true PART_CREATE_INITIAL=false; do
  curl -fsS -u "$admin_user:$admin_password" -X PATCH -H 'Content-Type: application/json' \
    -d "{\"value\": \"${setting#*=}\"}" "http://localhost/api/settings/global/${setting%%=*}/" > /dev/null
done

# On a new database the first read of LOGIN_ENFORCE_MFA creates it, and its save hook ends every user session;
# trigger that now, before the UI setup logs in, or the saved browser session is dropped mid-run.
curl -fsS -u "$admin_user:$admin_password" http://localhost/api/settings/global/LOGIN_ENFORCE_MFA/ > /dev/null

echo "InvenTree $(curl -fsS http://localhost/api/ | grep -o '"version":"[^"]*"') is up on http://localhost"

# View-only READER through the REST API (the management shell skips the profile and owner records InvenTree needs).
api() { curl -fsS -u "$admin_user:$admin_password" -H 'Content-Type: application/json' "$@"; }
reader_user="ci-reader"
reader_password="$(openssl rand -hex 16)"
echo "::add-mask::$reader_password"
group_id="$(api -X POST -d '{"name": "ci-readers"}' http://localhost/api/user/group/ | jq -r .pk)"
for ruleset in $(api "http://localhost/api/user/ruleset/?group=$group_id&limit=50" | jq -r '.results[] | select(.name != "admin") | .pk'); do
  api -X PATCH -d '{"can_view": true, "can_add": false, "can_change": false, "can_delete": false}' \
    "http://localhost/api/user/ruleset/$ruleset/" > /dev/null
done
reader_id="$(api -X POST -d "{\"username\": \"$reader_user\", \"first_name\": \"CI\", \"last_name\": \"Reader\", \"email\": \"ci-reader@example.com\", \"group_ids\": [$group_id], \"is_staff\": false, \"is_superuser\": false, \"is_active\": true}" \
  http://localhost/api/user/ | jq -r .pk)"
api -X PUT -d "{\"password\": \"$reader_password\", \"override_warning\": true}" \
  "http://localhost/api/user/$reader_id/set-password/" > /dev/null
if [ "$(curl -s -o /dev/null -w '%{http_code}' -u "$reader_user:$reader_password" 'http://localhost/api/part/?limit=1')" != "200" ]; then
  echo "::error::The CI reader user cannot view parts"
  exit 1
fi

{
  echo "LOCAL_SUPERUSER_USERNAME=$admin_user"
  echo "LOCAL_SUPERUSER_PASSWORD=$admin_password"
  echo "LOCAL_READER_USERNAME=$reader_user"
  echo "LOCAL_READER_PASSWORD=$reader_password"
  echo "INVENTREE_COMPOSE_DIR=$dir"
} >> "$GITHUB_ENV"
