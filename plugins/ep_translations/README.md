# ep_translations

**A Plugin to override [Etherpad](https://github.com/ether/etherpad-lite) and it's plugins translations**

This plugin uses separate translations folder that contains files which override all other translations.
As all plugins are translated separately in each project, there might me cases where translations are missing for some languages.
Also sometimes translations might not be as accurate or look a little clumsy. This plugin can load translations from separate Git repository on the go, or use static committed files that are stored in `/src/ep_translations` folder.

For git config details look: https://github.com/strugee/node-git-clone-or-pull

Plugin config for using Git:
``` javascript
"ep_translations":{
    "type": "git",
    "path": "<path to git repo>",
    "branch" "<branch name>", //name of branch, if not set, default is master
    "implementation": "<name of implementation>" //if not set, default is nodegit
    "savePath": "/path/to/translaions/location" //by default is set to node_modules/ep_translations/locales
  }
```

## Credits

* [Citizen OS](https://citizenos.com) for funding the development 
