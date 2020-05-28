<<<<<<< HEAD
# Etherpad-Lite Heroku

Deploy Etherpad-Lite on Heroku. Whole Etherpad-Lite configuration, including plugins, can be specified in Heroku configuration variables (ENV).
 
## Running

### Cloning
=======
# A real-time collaborative editor for the web
<a href="https://hub.docker.com/r/etherpad/etherpad"><img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/etherpad/etherpad"></a>
[![Travis (.org)](https://img.shields.io/travis/ether/etherpad-lite)](https://travis-ci.org/github/ether/etherpad-lite)
![Demo Etherpad Animated Jif](doc/images/etherpad_demo.gif "Etherpad in action")

# About
Etherpad is a real-time collaborative editor scalable to thousands of simultaneous real time users. It provides full data export capabilities, and runs on _your_ server, under _your_ control.

**[Try it out](https://video.etherpad.com)**
>>>>>>> 6a0f73d1379b4b97df1ffb20566f64eac3b09ccc

As the project has Etherpad as submodule, you need to clone it with `--recursive` flag:

<<<<<<< HEAD
`git clone --recursive https://github.com/citizenos/etherpad-lite-heroku.git`

### Configuration

Configuration can be specified in 2 ways:

* File (`config/local.json`) - designed for development environments where file configuration is simpler to maintain than env variables. See the example [local.json](config/local.json.example)
* Environment variables - this is where all Heroku configuration variables show up.
=======
## Requirements
- `nodejs` >= **10.13.0**.

## GNU/Linux and other UNIX-like systems

### Quick install on Debian/Ubuntu
```
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt install -y nodejs
git clone --branch master https://github.com/ether/etherpad-lite.git && cd etherpad-lite && bin/run.sh
```

### Manual install
You'll need git and [node.js](https://nodejs.org) installed (minimum required Node version: **10.13.0**).

**As any user (we recommend creating a separate user called etherpad):**

1. Move to a folder where you want to install Etherpad. Clone the git repository: `git clone --branch master git://github.com/ether/etherpad-lite.git`
2. Change into the new directory containing the cloned source code: `cd etherpad-lite`
3. run `bin/run.sh` and open <http://127.0.0.1:9001> in your browser.

To update to the latest released version, execute `git pull origin`. The next start with `bin/run.sh` will update the dependencies.

[Next steps](#next-steps).

## Windows

### Prebuilt Windows package
This package runs on any Windows machine, but for development purposes, please do a manual install.

1. [Download the latest Windows package](https://etherpad.org/#download)
2. Extract the folder

Run `start.bat` and open <http://localhost:9001> in your browser. You like it? [Next steps](#next-steps).

### Manually install on Windows
You'll need [node.js](https://nodejs.org) and (optionally, though recommended) git.

1. Grab the source, either
  - download <https://github.com/ether/etherpad-lite/zipball/master>
  - or `git clone --branch master https://github.com/ether/etherpad-lite.git`
2. With a "Run as administrator" command prompt execute `bin\installOnWindows.bat`
>>>>>>> 6a0f73d1379b4b97df1ffb20566f64eac3b09ccc

**NOTE:** Environment variables override `config/local.json`.

#### Etherpad-Lite configuration variables 

In Heroku config variables (ENV):

* `ETHERPAD_SETTINGS` - JSON string of the whole standard Etherpad-Lite `settings.json`.
* `ETHERPAD_SESSION_KEY` - The secret stored in Etherpad-Lite `SESSIONKEY.txt`.
* `ETHERPAD_API_KEY` - The secret stored in Etherpad-Lite `APIKEY.txt`.
* `DATABASE_URL` - Default database URI environment variable set by Heroku. It overrides all other DB configurations.

<<<<<<< HEAD
JSON defined in `ETHERPAD_SETTINGS` or `config/local.json`:

* `___apiKey` - The secret stored in Etherpad-Lite `APIKEY.txt`.
* `___sessionKey` - The secret stored in Etherpad-Lite `SESSIONKEY.txt`.
* `___version` - Per plugin configuration. Version of plugin to be installed by NPM.

#### Plugin configuration
=======
## Docker container

Find [here](doc/docker.md) information on running Etherpad in a container.

# Next Steps

## Tweak the settings
You can modify the settings in `settings.json`.
If you need to handle multiple settings files, you can pass the path to a settings file to `bin/run.sh` using the `-s|--settings` option: this allows you to run multiple Etherpad instances from the same installation.
Similarly, `--credentials` can be used to give a settings override file, `--apikey` to give a different APIKEY.txt file and `--sessionkey` to give a non-default SESSIONKEY.txt.
**Each configuration parameter can also be set via an environment variable**, using the syntax `"${ENV_VAR}"` or `"${ENV_VAR:default_value}"`. For details, refer to `settings.json.template`.
Once you have access to your `/admin` section settings can be modified through the web browser.

If you are planning to use Etherpad in a production environment, you should use a dedicated database such as `mysql`, since the `dirtyDB` database driver is only for testing and/or development purposes.
>>>>>>> 6a0f73d1379b4b97df1ffb20566f64eac3b09ccc

Plugin version and configuration can be specified. Plugins are configured as you would normally do in Etherpad-Lite `settings.json`, but you can also specify plugin version which will be installed by NPM.

* `___version` - version of the plugin to be installed.

<<<<<<< HEAD
Example plugin config in `ETHERPAD_SETTINGS` or `config/local.json`:

```
  "ep_themes_ext": {
    "___version": "0.0.4",
    "default": [
      "https://dev.citizenos.com:3001/static/styles/etherpad.css"
    ]
  }
```
#### Etherpad-Lite Heroku specific conf

* `ETHERPAD_LITE_HEROKU_LOGGER_LEVEL` - Logging level for the [start.js](start.js) script.

### Run

#### Heroku
=======
## Customize functionalities with plugins

![Basic install](doc/images/etherpad_basic.png "Basic Installation")

![Full Features](doc/images/etherpad_full_features.png "You can add a lot of plugins !")

Etherpad is very customizable through plugins. Instructions for installing themes and plugins can be found in [the plugin wiki article](https://github.com/ether/etherpad-lite/wiki/Available-Plugins).

## Customize the style with skin variants

Open <http://127.0.0.1:9001/p/test#skinvariantsbuilder> in your browser and start playing !

![Skin Variant](doc/images/etherpad_skin_variants.gif "Skin variants")

## Helpful resources
The [wiki](https://github.com/ether/etherpad-lite/wiki) is your one-stop resource for Tutorials and How-to's.

Documentation can be found in `doc/`.

# Development

## Things you should know
You can debug Etherpad using `bin/debugRun.sh`.

You can run Etherpad quickly launching `bin/fastRun.sh`. It's convenient for developers and advanced users. Be aware that it will skip the dependencies update, so remember to run `bin/installDeps.sh` after installing a new dependency or upgrading version.

If you want to find out how Etherpad's `Easysync` works (the library that makes it really realtime), start with this [PDF](https://github.com/ether/etherpad-lite/raw/master/doc/easysync/easysync-full-description.pdf) (complex, but worth reading).

## Contributing
Read our [**Developer Guidelines**](https://github.com/ether/etherpad-lite/blob/master/CONTRIBUTING.md)

# Get in touch
The official channel for contacting the development team is via the [Github issues](https://github.com/ether/etherpad-lite/issues).

For **responsible disclosure of vulnerabilities**, please write a mail to the maintainer (a.mux@inwind.it).

# HTTP API
Etherpad is designed to be easily embeddable and provides a [HTTP API](https://github.com/ether/etherpad-lite/wiki/HTTP-API)
that allows your web application to manage pads, users and groups. It is recommended to use the [available client implementations](https://github.com/ether/etherpad-lite/wiki/HTTP-API-client-libraries) in order to interact with this API.

OpenAPI (previously swagger) definitions for the API are exposed under `/api/openapi.json`.

# jQuery plugin
There is a [jQuery plugin](https://github.com/ether/etherpad-lite-jquery-plugin) that helps you to embed Pads into your website.

# Plugin Framework
Etherpad offers a plugin framework, allowing you to easily add your own features. By default your Etherpad is extremely light-weight and it's up to you to customize your experience. Once you have Etherpad installed you should visit the plugin page and take control.
>>>>>>> 6a0f73d1379b4b97df1ffb20566f64eac3b09ccc

Push it to your Heroku and Heroku will just run it picking up the entry point from [Procfile](Procfile)

#### Locally

<<<<<<< HEAD
* `npm run start-dev`

**NOTE:** When running locally with Citizen OS API, you may run into issues with certificate chain validation because of the API calls. In that case for **DEV ONLY** you can turn off the validation starting the app `NODE_TLS_REJECT_UNAUTHORIZED=0 npm run start-dev`.
**NOTE2:** DO NOT commit the generated `package.json`. If generated plugin configuration is in the `package.json` `/config/` has no effect.

## Credits
 
* This project started as a fork of https://github.com/bright-star/etherpad-lite-heroku and basic concepts are borrowed from there.
* [CitizenOS](https://citizenos.com) for funding the development
=======
# License
[Apache License v2](http://www.apache.org/licenses/LICENSE-2.0.html)
>>>>>>> 6a0f73d1379b4b97df1ffb20566f64eac3b09ccc
