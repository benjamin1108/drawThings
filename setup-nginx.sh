#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-draw.mindfree.top}"
UPSTREAM_PORT="${UPSTREAM_PORT:-5173}"
EMAIL="${EMAIL:-}"

if ! command -v nginx >/dev/null 2>&1; then
  echo "nginx 未安装或不可用。"
  exit 1
fi

if ! command -v certbot >/dev/null 2>&1; then
  echo "certbot 未安装或不可用。"
  exit 1
fi

if [ -z "$EMAIL" ]; then
  read -r -p "请输入证书邮箱（留空则用 --register-unsafely-without-email）：" EMAIL
fi

CONFIG_PATH="/etc/nginx/sites-available/${DOMAIN}.conf"
ENABLED_PATH="/etc/nginx/sites-enabled/${DOMAIN}.conf"
TMP_CONFIG="/tmp/${DOMAIN}.conf"

DOLLAR='$'
cat > "$TMP_CONFIG" <<EOF
server {
  listen 80;
  server_name ${DOMAIN};

  client_max_body_size 20m;

  location / {
    proxy_pass http://127.0.0.1:${UPSTREAM_PORT};
    include /etc/nginx/proxy_params;
    proxy_http_version 1.1;
    proxy_set_header Upgrade ${DOLLAR}http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 300;
  }
}
EOF
sudo mv "$TMP_CONFIG" "$CONFIG_PATH"

if [ ! -e "$ENABLED_PATH" ]; then
  sudo ln -s "$CONFIG_PATH" "$ENABLED_PATH"
fi

sudo nginx -t
sudo systemctl reload nginx

if [ -n "$EMAIL" ]; then
  sudo certbot --nginx -d "$DOMAIN" --redirect -m "$EMAIL" --agree-tos --no-eff-email
else
  sudo certbot --nginx -d "$DOMAIN" --redirect --register-unsafely-without-email --agree-tos
fi

echo "完成：${DOMAIN} 已通过 Nginx 反代到 127.0.0.1:${UPSTREAM_PORT} 并启用 HTTPS。"
