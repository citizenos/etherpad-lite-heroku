#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Default settings
const defaultSettings = {
  title: "Etherpad-Lite / CitizenOS",
  favicon: "favicon.ico",
  ip: "0.0.0.0",
  port: 9001,
  defaultPadText: "Topic content here..",
  requireSession: false,
  editOnly: true,
  authenticationMethod: "apikey",
  skinName: "colibris",
  minify: false,
  maxAge: 21600,
  abiword: null,
  requireAuthentication: true,
  requireAuthorization: true,
  trustProxy: true,
  disableIPlogging: false,
  socketTransportProtocols: [
    "websocket",
    "xhr-polling",
    "jsonp-polling",
    "htmlfile"
  ],
  loglevel: "INFO",
  logconfig: {
    appenders: [
      {
        type: "console"
      }
    ]
  },
  padOptions: {
    noColors: true,
    showControls: true,
    showChat: false,
    showLineNumbers: false,
    useMonospaceFont: false,
    userName: false,
    userColor: false,
    rtl: false,
    alwaysShowChat: false,
    chatAndUsers: false,
    lang: "en-gb"
  },
  skinVariants: "full-width-editor",
  toolbar: {
    left: [
      [
        "bold",
        "italic",
        "underline",
        "strikethrough"
      ],
      [
        "orderedlist",
        "unorderedlist",
        "indent",
        "outdent"
      ],
      [
        "alignLeft",
        "alignCenter",
        "alignRight"
      ],
      [
        "undo",
        "redo"
      ],
      [
        "fontColor",
        "addFootNote"
      ]
    ],
    right: [
      [
        "timeslider"
      ]
    ],
    timeslider: [
      [
        "timeslider_returnToPad"
      ]
    ],
    custom_inline: [
      [
        {
          createVote: {
            buttonType: "link",
            title: "Create new mini-vote",
            localizationId: "ep_inline_voting.title_create_voting"
          }
        }
      ]
    ]
  }
};

// Plugin configurations
const pluginSettings = {
  ep_align: {
    ___version: process.env.EP_ALIGN_VERSION || "0.3.96"
  },
  ep_authorship_toggle: {
    ___version: process.env.EP_AUTHORSHIP_TOGGLE_VERSION || "0.0.9"
  },
  ep_auth_citizenos: {
    ___version: process.env.EP_AUTH_CITIZENOS_VERSION || "1.0.15",
    jwt: {
      publicKey: process.env.EP_AUTH_CITIZENOS_JWT_PUBLIC_KEY || "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4x3Ld7aV+QefkrdISdws\nNFP2nxIpY/vVffttUxrBmQ8FKZTP72uRfJ4p7TafP2AY69UKS9uKemKQs/E9U4yy\nYgKPTD1m3fzs6THh0fwP8Et6qinQI5HP+OcuRDm95q3GoLk4gcF4EKcAFZA2JrFC\nSWWhiJ7qCb++fM3bFcy1i10VoLUaLNJxhkwxOrk15QPgR8uFvLqDIzvJn3GuKpkk\nunvU8VZ2vucCVUH91JPY23iNukGuUE/e+b8H9oyi/vomRpU3zNIKCrk/fynyPAhM\npQWaOT4cNibHOS+KNqJpCKKi3xvfxb+fZvX9sVKLzbibCj2vSL8wjUyayw0zOfnY\n1QIDAQAB\n-----END PUBLIC KEY-----",
      algorithms: ["RS256"]
    },
    api: {
      cors: {
        origin: process.env.EP_AUTH_CITIZENOS_CORS_ORIGIN ?
          process.env.EP_AUTH_CITIZENOS_CORS_ORIGIN.split(',') :
          ["\\.citizenos\\.com(:[0-9]{2,4})?$", "citizenos\\.com(:[0-9]{2,4})?$"],
        allowedHeaders: [
          "User-Agent", "Accept-Language", "Connection", "Cookie",
          "Accept-Encoding", "Host", "Origin", "Content-Type",
          "Content-Length", "Accept", "Referer"
        ],
        credentials: true
      }
    },
    authorization: {
      url: process.env.EP_AUTH_CITIZENOS_AUTH_URL || "https://dev.api.citizenos.com:3003/api/internal/topics/:topicId/permissions",
      apiKey: process.env.EP_AUTH_CITIZENOS_API_KEY || "superSecretAPIkeySentInXApiKeyHeader",
      cacheMaxAge: parseInt(process.env.EP_AUTH_CITIZENOS_CACHE_MAX_AGE) || 60000
    },
    authorSync: {
      url: process.env.EP_AUTH_CITIZENOS_SYNC_URL || "https://dev.api.citizenos.com:3003/api/internal/users/:userId"
    }
  },
  ep_embed_floating_toolbar: {
    ___version: process.env.EP_EMBED_FLOATING_TOOLBAR_VERSION || "0.0.8"
  },
  ep_add_hyperlink: {
    ___version: process.env.EP_ADD_HYPERLINK_VERSION || "0.0.2"
  },
  ep_font_color: {
    ___version: process.env.EP_FONT_COLOR_VERSION || "0.0.87"
  },
  ep_font_size: {
    ___version: process.env.EP_FONT_SIZE_VERSION || "0.4.61"
  },
  ep_foot_note: {
    ___version: process.env.EP_FOOT_NOTE_VERSION || "0.1.7"
  },
  ep_headings2: {
    ___version: process.env.EP_HEADINGS2_VERSION || "0.2.64"
  },
  ep_resize: {
    ___version: process.env.EP_RESIZE_VERSION || "0.0.18"
  },
  ep_themes_ext: {
    ___version: process.env.EP_THEMES_EXT_VERSION || "0.0.10",
    default: process.env.EP_THEMES_EXT_DEFAULT ?
      process.env.EP_THEMES_EXT_DEFAULT.split(',') :
      ["https://dev.app.citizenos.com:3003/etherpad.css"],
    "citizenos.com": process.env.EP_THEMES_EXT_CITIZENOS ?
      process.env.EP_THEMES_EXT_CITIZENOS.split(',') :
      ["https://dev.app.citizenos.com:3003/etherpad.css"]
  },
  ep_translations: {
    ___version: process.env.EP_TRANSLATIONS_VERSION || "0.0.17",
    type: "git",
    path: process.env.EP_TRANSLATIONS_PATH || "git@github.com:citizenos/etherpad_translations.git",
    savePath: process.env.EP_TRANSLATIONS_SAVE_PATH || "/tmp/ep_translations"
  },
  ep_webhooks: {
    ___version: process.env.EP_WEBHOOKS_VERSION || "1.0.17",
    apiKey: process.env.EP_WEBHOOKS_API_KEY || "superSecretAPIkeySentInXApiKeyHeader",
    pads: {
      update: process.env.EP_WEBHOOKS_PADS_UPDATE ?
        process.env.EP_WEBHOOKS_PADS_UPDATE.split(',') :
        ["https://dev.api.citizenos.com:3003/api/internal/notifications/pads/update"]
    }
  }
};

// Merge settings with environment variables
const settings = {
  ...defaultSettings,
  title: process.env.ETHERPAD_TITLE || defaultSettings.title,
  ip: process.env.ETHERPAD_IP || defaultSettings.ip,
  port: parseInt(process.env.ETHERPAD_PORT) || defaultSettings.port,
  defaultPadText: process.env.ETHERPAD_DEFAULT_PAD_TEXT || defaultSettings.defaultPadText,
  requireSession: process.env.ETHERPAD_REQUIRE_SESSION === 'true' || defaultSettings.requireSession,
  editOnly: process.env.ETHERPAD_EDIT_ONLY === 'true' || defaultSettings.editOnly,
  authenticationMethod: process.env.ETHERPAD_AUTHENTICATION_METHOD || defaultSettings.authenticationMethod,
  skinName: process.env.ETHERPAD_SKIN_NAME || defaultSettings.skinName,
  minify: process.env.ETHERPAD_MINIFY === 'true' || defaultSettings.minify,
  maxAge: parseInt(process.env.ETHERPAD_MAX_AGE) || defaultSettings.maxAge,
  requireAuthentication: process.env.ETHERPAD_REQUIRE_AUTHENTICATION === 'true' || defaultSettings.requireAuthentication,
  requireAuthorization: process.env.ETHERPAD_REQUIRE_AUTHORIZATION === 'true' || defaultSettings.requireAuthorization,
  trustProxy: process.env.ETHERPAD_TRUST_PROXY === 'true' || defaultSettings.trustProxy,
  disableIPlogging: process.env.ETHERPAD_DISABLE_IP_LOGGING === 'true' || defaultSettings.disableIPlogging,
  loglevel: process.env.ETHERPAD_LOG_LEVEL || defaultSettings.loglevel,
  skinVariants: process.env.ETHERPAD_SKIN_VARIANTS || defaultSettings.skinVariants,
  ...pluginSettings
};

// Write settings to file
const settingsPath = process.env.SETTINGS_PATH || '/opt/etherpad-lite/settings.json';
fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

console.log(`Settings written to ${settingsPath}`);
console.log('Environment variables used:');
Object.keys(process.env).filter(key => key.startsWith('ETHERPAD_') || key.startsWith('EP_')).forEach(key => {
  console.log(`  ${key}=${process.env[key]}`);
});