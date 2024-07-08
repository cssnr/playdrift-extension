[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/anlkpnbhiiojmedlkchcdmigkdccnmcn?logo=google&logoColor=white&label=google%20users)](https://chromewebstore.google.com/detail/playdrift-extension/anlkpnbhiiojmedlkchcdmigkdccnmcn)
[![Mozilla Add-on Users](https://img.shields.io/amo/users/playdrift-extension?logo=mozilla&label=mozilla%20users)](https://addons.mozilla.org/addon/playdrift-extension)
[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/anlkpnbhiiojmedlkchcdmigkdccnmcn?label=chrome&logo=googlechrome)](https://chromewebstore.google.com/detail/playdrift-extension/anlkpnbhiiojmedlkchcdmigkdccnmcn)
[![Mozilla Add-on Version](https://img.shields.io/amo/v/playdrift-extension?label=firefox&logo=firefox)](https://addons.mozilla.org/addon/playdrift-extension)
[![GitHub Release Version](https://img.shields.io/github/v/release/cssnr/playdrift-extension?logo=github)](https://github.com/cssnr/playdrift-extension/releases/latest)
[![Build](https://img.shields.io/github/actions/workflow/status/cssnr/playdrift-extension/build.yaml?logo=github&logoColor=white&label=build)](https://github.com/cssnr/playdrift-extension/actions/workflows/build.yaml)
[![Test](https://img.shields.io/github/actions/workflow/status/cssnr/playdrift-extension/test.yaml?logo=github&logoColor=white&label=test)](https://github.com/cssnr/playdrift-extension/actions/workflows/test.yaml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=cssnr_playdrift-extension&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=cssnr_playdrift-extension)
[![Discord](https://img.shields.io/discord/899171661457293343?logo=discord&logoColor=white&label=discord&color=7289da)](https://discord.gg/wXy6m2X8wY)
# PlayDrift Extension

Modern [Chrome](https://chromewebstore.google.com/detail/playdrift-extension/anlkpnbhiiojmedlkchcdmigkdccnmcn) 
Web Extension and [Firefox](https://addons.mozilla.org/addon/playdrift-extension) 
Browser Addon for [PlayDrift](https://dominoes.playdrift.com/)
to view Rankings and Win/Loss Records on Player Profiles plus much more!
See the [Features](#features) list for a full list of features and [Problems Solved](#problems-solved)
for some of the most useful features.

*   [Install](#install)
*   [Features](#features)
    -   [Upcoming Features](#upcoming-features-and-ideas)
*   [Problems Solved](#problems-solved)
*   [Frequently Asked Questions](#frequently-asked-questions)
*   [Known Issues](#known-issues)
*   [Configuration](#configuration)
*   [Browser Console](#browser-console)
*   [Support](#support)
*   [Development](#development)
    -   [Building](#building)

[![Screen Shots](https://repository-images.githubusercontent.com/779112610/a81fa6cf-34d2-4454-870c-ac54ce088518)](https://playdrift-extension.cssnr.com/screenshots/)

[Visit Website](https://playdrift-extension.cssnr.com/) | [View Screen Shots](https://playdrift-extension.cssnr.com/screenshots/)

# Install

*   [Google Chrome Web Store](https://chromewebstore.google.com/detail/playdrift-extension/anlkpnbhiiojmedlkchcdmigkdccnmcn)
*   [Mozilla Firefox Add-ons](https://addons.mozilla.org/addon/playdrift-extension)

[![Chrome](https://raw.githubusercontent.com/smashedr/logo-icons/master/browsers/chrome_48.png)](https://chromewebstore.google.com/detail/playdrift-extension/anlkpnbhiiojmedlkchcdmigkdccnmcn)
[![Firefox](https://raw.githubusercontent.com/smashedr/logo-icons/master/browsers/firefox_48.png)](https://addons.mozilla.org/addon/playdrift-extension)
[![Edge](https://raw.githubusercontent.com/smashedr/logo-icons/master/browsers/edge_48.png)](https://chromewebstore.google.com/detail/playdrift-extension/anlkpnbhiiojmedlkchcdmigkdccnmcn)
[![Chromium](https://raw.githubusercontent.com/smashedr/logo-icons/master/browsers/chromium_48.png)](https://chromewebstore.google.com/detail/playdrift-extension/anlkpnbhiiojmedlkchcdmigkdccnmcn)
[![Brave](https://raw.githubusercontent.com/smashedr/logo-icons/master/browsers/brave_48.png)](https://chromewebstore.google.com/detail/playdrift-extension/anlkpnbhiiojmedlkchcdmigkdccnmcn)
[![Vivaldi](https://raw.githubusercontent.com/smashedr/logo-icons/master/browsers/vivaldi_48.png)](https://chromewebstore.google.com/detail/playdrift-extension/anlkpnbhiiojmedlkchcdmigkdccnmcn)
[![Opera](https://raw.githubusercontent.com/smashedr/logo-icons/master/browsers/opera_48.png)](https://chromewebstore.google.com/detail/playdrift-extension/anlkpnbhiiojmedlkchcdmigkdccnmcn)

All **Chromium** Based Browsers can install the extension from the
[Chrome Web Store](https://chromewebstore.google.com/detail/playdrift-extension/anlkpnbhiiojmedlkchcdmigkdccnmcn).

# Features

> [!TIP]  
> All features are **Optional** and disabled by default. Visit the options page to enable them.
> You can access options through the extension icon, see [Configuration](#configuration) for more info.

*   Track Recent Game History, Wins/Losses, Rating and Date
*   Show Players Rating and Record (Win/Loss)
*   Show Stats Tooltip on Mouse Over Icon
*   Show Stats on Icon on Mouse Over Icon
*   Send Player Stats to Chat on User Join
*   Send Your Own Stats to Chat When You Join
*   Send Player Leaving Active Game Alerts to Chat
*   Send Team Change Alerts to Chat
*   Send Player Kicked Alerts to Chat
*   Keep Team Set After Selecting One
*   Add Cancel Ready Button if you are the Room Owner
*   Auto Update Game Options Dialog on Room Creation
*   Minimize Room Display by Reducing Paddings
*   Play Audio on Your Turn to Make a Move
*   Play Audio When Users Join or Leave a Room
*   Play Audio When Users Changes Teams
*   Play Audio on New Inbox Message
*   Play Audio on New Chat Message
*   Play Chat Message as Audio (TTS)
*   Ban User Feature w/ Auto Kick Banned Option
*   Auto Kick Users Below Set Win Rate Percentage
*   Auto Kick Users Below Set Total Games Played
*   Auto Continue Through the Game Stats at End of Game
*   Send Customizable Message on Game Start and Stats at End
*   Show Remaining Dominoes and Optionally Exclude Your Own
*   Add Custom Chat Commands that Anybody can Use
*   Close Profiles by Clicking Anywhere Outside the Profile
*   Show List of Kicked Players in Room below Players
*   Extended Kick Menu with Kick Reasons Sent to Chat

### Upcoming Features and Ideas

*   Custom Audio Sounds and Volume
*   Remember Recent Game and Room URLs
*   Remember Recent Players who Kicked You
*   End Game Player Stats (Total Points, Time Taken)
*   More Detailed History Including Opponents, Scores, etc.
*   Display Important Room Options in the Room as Colored Text
*   Friends/Favorites List w/ notifications when they join game
*   Remember how many times you played with a player and display in tooltip

> [!TIP]
> **Don't see your feature here?**
> Request one on the [Feature Request Discussion](https://github.com/cssnr/playdrift-extension/discussions/categories/feature-requests).

# Problems Solved

PlayDrift negligence has created a few major issues on the site that this extension aims to solve.

1. No Way to Judge Opponents Skill

The game changed to reward quantity over quality. Someone who plays 1,000 games and losses all 1,000 games 
will appear 10x more skilled a player vs someone who only plays 100 games and wins all 100.

> **Solution:** This extension exposes the total Wins and Losses in a players profile and calculates a Win Rate. 
> It also provides the Rating; however, rating is worthless fot two reasons. 1, nobody can see it. 2, it starts at 0.

2. Habitual Game Leavers for Points

Since there is no downside to losing a game, only an upside, many people queue for 1 additional game when they 
are done playing and leave as soon as it starts for the extra points.

> **Solution:** This extension can provide both audible and visual notifications when a player leave the game and has
> ability to ban these players to they are automatically kicked from all future games.

3. Robot Players

Not sure if done by PlayDrift or externally but many of the players on this site are not humans, but robots. At a glance
these bots play the game manually and send the "Joined the game" message to new roms when they join. They can also play
any domino they want on the first round of 4 and hold on to the 6/6 since they play manually.

> **Solution:** These bots can't win more than 1/3 games and all have a win rate around 35%. The feature to Auto Kick players 
> below a set win rate (recommended at 40%) will kick almost all the bots, plus a couple humans that only win 1/3 games.

# Frequently Asked Questions

### Where do the stats come from?

The stats come from your PlayDrift profile. See [Browser Console](#browser-console) for more information.

### What is the purpose of robot players?

The main theory is that the bots are from PlayDrift to maintain activity on the site during low activity hours.
Also, since the site rewards total play over quality play, the bots could be leveling accounts for future uses.
However, with no gains from leveled up accounts, it is most likely the bots are from PlayDrift.

> [!TIP]
> **Don't see your question here?**
> Ask one on the [Q&A Discussion](https://github.com/cssnr/playdrift-extension/discussions/categories/q-a).

# Known Issues

*   The Mouse Over Icon Stats do not properly update when a room changes positions on the home page
*   Cancel Ready Button will also reset teams for anyone not using the Keep Teams Set Option

> [!TIP]
> **Don't see your issue here?**
> Open one on the [Issues](https://github.com/cssnr/playdrift-extension/issues).

# Configuration

You can pin the Addon by clicking the `Puzzle Piece`, find the Web Extension icon, then;  
**Chrome**, click the `Pin` icon.  
**Firefox**, click the `Settings Wheel` and `Pin to Toolbar`.

To open the options, click on the icon (from above) then click `Open Options`.

You may also access the Options and Home page from a Right Click if Enabled in Options.

# Browser Console

You can view user profiles manually in your browser or console using the following methods.

### Browser

First, get the user ID by clicking on their profile and extracting it from the URL in the address bar.  
Example: https://dominoes.playdrift.com/?profile=fdb82ace-7826-45b1-922b-416d4e9ded9d  
The ID is the part after the ?profile=  
Example: `fdb82ace-7826-45b1-922b-416d4e9ded9d`

Second, use the above ID with the following URL:  
https://api-v2.playdrift.com/api/profile/trpc/profile.get?input={"id":"fdb82ace-7826-45b1-922b-416d4e9ded9d","game":"dominoes"}  
_Note: You need to replace the ID in the above URL with the one from the First step._

### Console

Make sure you are at `https://dominoes.playdrift.com/` and logged in before proceeding.

*   Press `F12` to open the console (for most browsers). May also be: `Ctrl`+`Shift`+`I`
*   Select the **Network** tab from the top.
*   In the **Filter URLs** box enter the following filter: `method:get profile.get`
*   You should see many requests for *profile.get?input=XXX* etc. (if not, refresh the page).
*   Click on one of the individual requests, this will bring up a new set of tabs (usually on the right or bottom).
*   From these new tabs, select the `Response` tab. It should be the 4th tab in (Headers, Cookies, Request, Response, etc).
*   From there you should see the `result`. Click on the small `>` Arrow to expand it. Click the next `>` Arrow on data.
*   Once fully expanded, you should see the profile. Then you can select any other response to view those profiles.

# Support

For help using the web extension, utilize any these resources:

- Documentation: https://playdrift-extension.cssnr.com/docs/
- Q&A Discussion: https://github.com/cssnr/playdrift-extension/discussions/categories/q-a
- Request a Feature: https://github.com/cssnr/playdrift-extension/discussions/categories/feature-requests

If you are experiencing an issue/bug or getting unexpected results, use:

- Report an Issue: https://github.com/cssnr/playdrift-extension/issues
- Chat with us on Discord: https://discord.gg/wXy6m2X8wY
- Provide Anonymous Feedback: https://cssnr.github.io/feedback

Logs can be found inspecting the page (Ctrl+Shift+I), clicking on the Console, and;
Firefox: toggling Debug logs, Chrome: toggling Verbose from levels dropdown.

Note: When providing anonymous feedback there is no way to follow up and get more information unless you provide a contact method.

# Development

**Quick Start**

First, clone (or download) this repository and change into the directory.

Second, install the dependencies:
```shell
npm install
```

Finally, to run Chrome or Firefox with web-ext, run one of the following:
```shell
npm run chrome
npm run firefox
```

Additionally, to Load Unpacked/Temporary Add-on make a `manifest.json` and run from the [src](src) folder, run one of the following:
```shell
npm run manifest:chrome
npm run manifest:firefox
```

Chrome: [https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)  
Firefox: [https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)

For more information on web-ext, [read this documentation](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/).  
To pass additional arguments to an `npm run` command, use `--`.  
Example: `npm run chrome -- --chromium-binary=...`

## Building

Install the requirements and copy libraries into the `src/dist` directory by running `npm install`.
See [gulpfile.js](gulpfile.js) for more information on `postinstall`.
```shell
npm install
```

To create a `.zip` archive of the [src](src) directory for the desired browser run one of the following:
```shell
npm run build
npm run build:chrome
npm run build:firefox
```

For more information on building, see the scripts section in the [package.json](package.json) file.

## Chrome Setup

1.  Build or Download a [Release](https://github.com/cssnr/playdrift-extension/releases).
1.  Unzip the archive, place the folder where it must remain and note its location for later.
1.  Open Chrome, click the `3 dots` in the top right, click `Extensions`, click `Manage Extensions`.
1.  In the top right, click `Developer Mode` then on the top left click `Load unpacked`.
1.  Navigate to the folder you extracted in step #3 then click `Select Folder`.

## Firefox Setup

1.  Build or Download a [Release](https://github.com/cssnr/playdrift-extension/releases).
1.  Unzip the archive, place the folder where it must remain and note its location for later.
1.  Go to `about:debugging#/runtime/this-firefox` and click `Load Temporary Add-on...`
1.  Navigate to the folder you extracted earlier, select `manifest.json` then click `Select File`.
1.  Optional: Open `about:config` search for `extensions.webextensions.keepStorageOnUninstall` and set to `true`.

If you need to test a restart, you must pack the addon. This only works in ESR, Development, or Nightly.
You may also use an Unbranded Build: [https://wiki.mozilla.org/Add-ons/Extension_Signing#Unbranded_Builds](https://wiki.mozilla.org/Add-ons/Extension_Signing#Unbranded_Builds)

1.  Run `npm run build:firefox` then use `web-ext-artifacts/{name}-firefox-{version}.zip`.
1.  Open `about:config` search for `xpinstall.signatures.required` and set to `false`.
1.  Open `about:addons` and drag the zip file to the page or choose Install from File from the Settings wheel.
