[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/coming-soon?logo=google&logoColor=white&label=google%20users)](https://chromewebstore.google.com/detail/playdrift-extension/coming-soon)
[![Mozilla Add-on Users](https://img.shields.io/amo/users/playdrift-extension?logo=mozilla&label=mozilla%20users)](https://addons.mozilla.org/addon/playdrift-extension)
[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/coming-soon?label=chrome&logo=googlechrome)](https://chromewebstore.google.com/detail/playdrift-extension/coming-soon)
[![Mozilla Add-on Version](https://img.shields.io/amo/v/playdrift-extension?label=firefox&logo=firefox)](https://addons.mozilla.org/addon/playdrift-extension)
[![GitHub Release Version](https://img.shields.io/github/v/release/cssnr/playdrift-extension?logo=github)](https://github.com/cssnr/playdrift-extension/releases/latest)
[![Manifest Version](https://img.shields.io/github/manifest-json/v/cssnr/playdrift-extension?filename=manifest.json&logo=json&label=manifest)](https://github.com/cssnr/playdrift-extension/blob/master/manifest.json)
[![Build](https://github.com/cssnr/playdrift-extension/actions/workflows/build.yaml/badge.svg)](https://github.com/cssnr/playdrift-extension/actions/workflows/build.yaml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=cssnr_playdrift-extension&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=cssnr_playdrift-extension)
# PlayDrift Extension

Modern Chrome Web Extension and Firefox Browser Addon for PlayDrift to view Rankings and Win/Loss records on player profiles.

*   [Chrome Setup](#chrome-setup)
*   [Firefox Setup](#firefox-setup)
*   [Install](#install) (coming soon, use chrome/firefox setup instead)
*   [Features](#features)
*   [Configuration](#configuration)
*   [Browser Console](#browser-console)
*   [Development](#development)
    -   [Building](#building)

[![GitHub Image](https://repository-images.githubusercontent.com/779112610/a81fa6cf-34d2-4454-870c-ac54ce088518)](https://github.com/cssnr/playdrift-extension)

# Install

> [!WARNING]  
> **Coming Soon**
> 
> See [Chrome Setup](#chrome-setup) or [Firefox Setup](#firefox-setup) for a manual install!
>

*   [Google Chrome Web Store](https://chromewebstore.google.com/detail/playdrift-extension/coming-soon)
*   [Mozilla Firefox Add-ons](https://addons.mozilla.org/addon/playdrift-extension)

[![Chrome](https://raw.githubusercontent.com/alrra/browser-logos/main/src/chrome/chrome_48x48.png)](https://chromewebstore.google.com/detail/playdrift-extension/coming-soon)
[![Firefox](https://raw.githubusercontent.com/alrra/browser-logos/main/src/firefox/firefox_48x48.png)](https://addons.mozilla.org/addon/playdrift-extension)
[![Edge](https://raw.githubusercontent.com/alrra/browser-logos/main/src/edge/edge_48x48.png)](https://chromewebstore.google.com/detail/playdrift-extension/coming-soon)
[![Chromium](https://raw.githubusercontent.com/alrra/browser-logos/main/src/chromium/chromium_48x48.png)](https://chromewebstore.google.com/detail/playdrift-extension/coming-soon)
[![Brave](https://raw.githubusercontent.com/alrra/browser-logos/main/src/brave/brave_48x48.png)](https://chromewebstore.google.com/detail/playdrift-extension/coming-soon)
[![Vivaldi](https://raw.githubusercontent.com/alrra/browser-logos/main/src/vivaldi/vivaldi_48x48.png)](https://chromewebstore.google.com/detail/playdrift-extension/coming-soon)
[![Opera](https://raw.githubusercontent.com/alrra/browser-logos/main/src/opera/opera_48x48.png)](https://chromewebstore.google.com/detail/playdrift-extension/coming-soon)

All **Chromium** Based Browsers can install the extension from the
[Chrome Web Store](https://chromewebstore.google.com/detail/playdrift-extension/coming-soon).

# Features

*   Show User Rating and Record (Win/Loss)
*   Track Recent Game History, Wins/Losses, Rating and Date
*   Show Stats Tooltip on Mouse Over
*   Show Stats on Icon on Mouse Over
*   Send Stats to Chat on User Join
*   Send Your Own Stats to Chat When You Join
*   Send Team Change Notifications to Chat
*   Play Audio on Your Turn to Make a Move
*   Play Audio When Users Join or Leave a Room
*   Play Audio When Users Changes Teams
*   Play Audio on New Inbox Message
*   Play Audio on New Chat Message
*   Play Chat Message as Audio (TTS)
*   Chat Notifications on Player Leaving an Active Game
*   Auto Kick Users Below Set Win Rate Percentage
*   Auto Kick Users Below Set Total Games Played
*   Ban User Feature that Automatically Kicks User in Future
*   Send Customizable Message on Game Start and Stats at End
*   Auto Update Game Options Dialog on Room Creation
*   Auto Continue Through the Game Stats at End of Game
*   Close Profiles by Clicking Anywhere Outside the Profile

Please submit a [Feature Request](https://github.com/cssnr/playdrift-extension/discussions/categories/feature-requests) for new features.  
For any issues, bugs or concerns; please [Open an Issue](https://github.com/cssnr/playdrift-extension/issues).

#### Planned Features and Ideas

*   Custom Audio Sounds and Volume
*   Custom Chat Commands and Options
*   Auto Select Team # and Keep it Set
*   Remember Recent Game and Room URLs
*   Remember Recent Players who Kicked You
*   Player Stats (Total Points, Time Taken)

# Configuration

You can pin the Addon by clicking the `Puzzle Piece`, find the Web Extension icon, then;  
**Chrome**, click the `Pin` icon.  
**Firefox**, click the `Settings Wheel` and `Pin to Toolbar`.

To open the options, click on the icon (from above) then click `Open Options`.

You may also access the Options and Home page from a Right Click if Enabled in Options.

# Browser Console

You can view user profiles manually in your browser console using the following methods.

#### Console

Make sure you are at `https://dominoes.playdrift.com/` and logged in before proceeding.

*   Press `F12` to open the console (for most browsers). May also be: `Ctrl`+`Shift`+`I`
*   Select the **Network** tab from the top.
*   In the **Filter URLs** box enter the following filter: `method:get profile.get`
*   You should see many requests for *profile.get?input=XXX* etc. (if not, refresh the page).
*   Click on one of the individual requests, this will bring up a new set of tabs (usually on the right or bottom).
*   From these new tabs, select the `Response` tab. It should be the 4th tab in (Headers, Cookies, Request, Response, etc).
*   From there you should see the `result`. Click on the small `>` Arrow to expand it. Click the next `>` Arrow on data.
*   Once fully expanded, you should see the profile. Then you can select any other response to view those profiles.

#### Browser

First, get the user ID by clicking on their profile and extracting it from the URL in the address bar.  
Example: https://dominoes.playdrift.com/?profile=fdb82ace-7826-45b1-922b-416d4e9ded9d  
The ID is the part after the ?profile=  
Example: `fdb82ace-7826-45b1-922b-416d4e9ded9d`  

Second, use the above ID with the following URL:  
https://api-v2.playdrift.com/api/profile/trpc/profile.get?input={"id":"fdb82ace-7826-45b1-922b-416d4e9ded9d","game":"dominoes"}

# Development

**Quick Start**

To install and run chrome or firefox with web-ext.
```shell
npm isntall
npm run chrome
npm run firefox
```

To Load Unpacked/Temporary Add-on make a `manifest.json` and run from the [src](src) folder.
```shell
npm run manifest:chrome
npm run manifest:firefox
```

For more information on web-ext, [read this documentation](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/).  
To pass additional arguments to an `npm run` command, use `--`.  
Example: `npm run chrome -- --chromium-binary=...`

## Building

Install the requirements and copy libraries into the `src/dist` directory by running `npm install`.
See [gulpfile.js](gulpfile.js) for more information on `postinstall`.
```shell
npm install
```

To load unpacked or temporary addon from the [src](src) folder, you must generate the `src/manifest.json` for the desired browser.
```shell
npm run manifest:chrome
npm run manifest:firefox
```

If you would like to create a `.zip` archive of the [src](src) directory for the desired browser.
```shell
npm run build
npm run build:chrome
npm run build:firefox
```

For more information on building, see the scripts in the [package.json](package.json) file.

## Chrome Setup

1.  Build or Download a [Release](https://github.com/cssnr/playdrift-extension/releases).
1.  Unzip the archive, place the folder where it must remain and note its location for later.
1.  Open Chrome, click the `3 dots` in the top right, click `Extensions`, click `Manage Extensions`.
1.  In the top right, click `Developer Mode` then on the top left click `Load unpacked`.
1.  Navigate to the folder you extracted in step #3 then click `Select Folder`.

## Firefox Setup

Note: Firefox Temporary addon's will **not** remain after restarting Firefox, therefore;
it is very useful to keep addon storage after uninstall/restart with `keepStorageOnUninstall`.

1.  Build or Download a [Release](https://github.com/cssnr/playdrift-extension/releases).
1.  Unzip the archive, place the folder where it must remain and note its location for later.
1.  Go to `about:debugging#/runtime/this-firefox` and click `Load Temporary Add-on...`
1.  Navigate to the folder you extracted earlier, select `manifest.json` then click `Select File`.
1.  Open `about:config` search for `extensions.webextensions.keepStorageOnUninstall` and set to `true`.

If you need to test a restart, you must pack the addon. This only works in ESR, Development, or Nightly.

1.  Run `npm run build:firefox` then use `web-ext-artifacts/{name}-firefox-{version}.zip`.
1.  Open `about:config` search for `xpinstall.signatures.required` and set to `false`.
1.  Open `about:addons` and drag the zip file to the page or choose Install from File from the Settings wheel.
