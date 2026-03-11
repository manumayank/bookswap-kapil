#!/bin/sh

# Replace the placeholder API URL with the actual runtime value
if [ -n "$NEXT_PUBLIC_API_URL" ]; then
  find /app/.next -type f -name "*.js" -exec sed -i "s|NEXT_PUBLIC_API_URL_PLACEHOLDER|$NEXT_PUBLIC_API_URL|g" {} +
fi

exec "$@"
