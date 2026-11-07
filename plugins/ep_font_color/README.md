![Publish Status](https://github.com/ether/ep_font_color/workflows/Node.js%20Package/badge.svg) ![Backend Tests Status](https://github.com/ether/ep_font_color/workflows/Backend%20tests/badge.svg)

# Etherpad plugin to change font color
If you want to reposition the color select in toolbar then in `settings.json` under `toolbar` add button `fontColor` example:
```
"toolbar": {
    "left": [
      [
        "fontColor",
        "bold",
        "italic",
        "underline",
        "strikethrough"
      ]
}
```