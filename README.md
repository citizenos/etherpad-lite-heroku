# Custom Etherpad Container

A custom Docker container for Etherpad with pre-installed plugins and environment variable configuration.

## Features

- Based on official Etherpad image
- Pre-installed plugins for enhanced functionality
- Environment variable configuration
- Production-ready setup

## Pre-installed Plugins

- `ep_align` - Text alignment plugin
- `ep_authorship_toggle` - Toggle authorship display
- `ep_auth_citizenos` - CitizenOS authentication
- `ep_embed_floating_toolbar` - Floating toolbar
- `ep_add_hyperlink` - Add hyperlinks
- `ep_font_color` - Font color options
- `ep_font_size` - Font size options
- `ep_foot_note` - Footnote functionality
- `ep_headings2` - Enhanced headings
- `ep_resize` - Resize functionality
- `ep_themes_ext` - Extended themes
- `ep_translations` - Translation support
- `ep_webhooks` - Webhook integration

## Quick Start

```bash
# Pull the image
docker pull ilmartyrk/citizenos:etherpad-latest

# Run with default settings
docker run -d --name etherpad -p 9001:9001 ilmartyrk/citizenos:etherpad-latest

# Run with custom settings
docker run -d --name etherpad \
  -p 9001:9001 \
  -e ETHERPAD_TITLE="My Custom Etherpad" \
  -e ETHERPAD_PORT=9001 \
  -e ETHERPAD_LOG_LEVEL=INFO \
  ilmartyrk/citizenos:etherpad-latest
```

## Environment Variables

### Core Etherpad Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `ETHERPAD_TITLE` | "Etherpad-Lite / CitizenOS" | Application title |
| `ETHERPAD_PORT` | 9001 | Port to run on |
| `ETHERPAD_IP` | "0.0.0.0" | IP to bind to |
| `ETHERPAD_LOG_LEVEL` | "INFO" | Log level |
| `ETHERPAD_DEFAULT_PAD_TEXT` | "Topic content here.." | Default pad text |
| `ETHERPAD_REQUIRE_SESSION` | false | Require user sessions |
| `ETHERPAD_EDIT_ONLY` | true | Edit-only mode |
| `ETHERPAD_AUTHENTICATION_METHOD` | "apikey" | Authentication method |
| `ETHERPAD_SKIN_NAME` | "colibris" | UI skin |
| `ETHERPAD_MINIFY` | false | Minify assets |
| `ETHERPAD_MAX_AGE` | 21600 | Max age for assets |
| `ETHERPAD_REQUIRE_AUTHENTICATION` | true | Require authentication |
| `ETHERPAD_REQUIRE_AUTHORIZATION` | true | Require authorization |
| `ETHERPAD_TRUST_PROXY` | true | Trust proxy headers |
| `ETHERPAD_DISABLE_IP_LOGGING` | false | Disable IP logging |
| `ETHERPAD_SKIN_VARIANTS` | "full-width-editor" | Skin variants |

### Plugin Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `EP_ALIGN_VERSION` | "0.3.96" | ep_align plugin version |
| `EP_AUTHORSHIP_TOGGLE_VERSION` | "0.0.9" | ep_authorship_toggle version |
| `EP_AUTH_CITIZENOS_VERSION` | "1.0.15" | ep_auth_citizenos version |
| `EP_EMBED_FLOATING_TOOLBAR_VERSION` | "0.0.8" | ep_embed_floating_toolbar version |
| `EP_ADD_HYPERLINK_VERSION` | "0.0.2" | ep_add_hyperlink version |
| `EP_FONT_COLOR_VERSION` | "0.0.87" | ep_font_color version |
| `EP_FONT_SIZE_VERSION` | "0.4.61" | ep_font_size version |
| `EP_FOOT_NOTE_VERSION` | "0.1.7" | ep_foot_note version |
| `EP_HEADINGS2_VERSION` | "0.2.64" | ep_headings2 version |
| `EP_RESIZE_VERSION` | "0.0.18" | ep_resize version |
| `EP_THEMES_EXT_VERSION` | "0.0.10" | ep_themes_ext version |
| `EP_TRANSLATIONS_VERSION` | "0.0.17" | ep_translations version |
| `EP_WEBHOOKS_VERSION` | "1.0.17" | ep_webhooks version |

### CitizenOS Auth Plugin Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `EP_AUTH_CITIZENOS_JWT_PUBLIC_KEY` | (default key) | JWT public key |
| `EP_AUTH_CITIZENOS_CORS_ORIGIN` | "citizenos.com" | CORS origins |
| `EP_AUTH_CITIZENOS_AUTH_URL` | "https://dev.api.citizenos.com:3003/api/internal/topics/:topicId/permissions" | Authorization URL |
| `EP_AUTH_CITIZENOS_API_KEY` | "superSecretAPIkeySentInXApiKeyHeader" | API key |
| `EP_AUTH_CITIZENOS_CACHE_MAX_AGE` | 60000 | Cache max age |
| `EP_AUTH_CITIZENOS_SYNC_URL` | "https://dev.api.citizenos.com:3003/api/internal/users/:userId" | User sync URL |

## Docker Compose Example

```yaml
version: '3.8'
services:
  etherpad:
    image: ilmartyrk/citizenos:etherpad-latest
    container_name: etherpad
    ports:
      - "9001:9001"
    environment:
      - ETHERPAD_TITLE=My Custom Etherpad
      - ETHERPAD_PORT=9001
      - ETHERPAD_LOG_LEVEL=INFO
      - ETHERPAD_REQUIRE_AUTHENTICATION=false
      - ETHERPAD_REQUIRE_AUTHORIZATION=false
    restart: unless-stopped
    volumes:
      - etherpad_data:/opt/etherpad-lite/var

volumes:
  etherpad_data:
```

## Building Locally

```bash
# Clone the repository
git clone <repository-url>
cd etherpad-lite-heroku

# Build the image
docker build -t custom-etherpad -f Dockerfile.custom .

# Run the container
docker run -d --name etherpad -p 9001:9001 custom-etherpad
```

## Accessing Etherpad

Once running, access Etherpad at:
- **URL**: http://localhost:9001
- **Default**: Requires authentication (configure users in settings)

## Troubleshooting

### Container won't start
- Check logs: `docker logs etherpad`
- Verify environment variables are correct
- Ensure port 9001 is available

### Authentication issues
- Set `ETHERPAD_REQUIRE_AUTHENTICATION=false` for testing
- Configure users in settings for production

### Plugin errors
- Check plugin versions are compatible
- Verify plugin configurations in environment variables

## License

This project is licensed under the Apache 2.0 License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
