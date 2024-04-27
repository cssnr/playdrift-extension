// JS Background Service Worker

import { openHome, playGame } from './export.js'

chrome.runtime.onStartup.addListener(onStartup)
chrome.runtime.onInstalled.addListener(onInstalled)
chrome.contextMenus.onClicked.addListener(onClicked)
chrome.commands.onCommand.addListener(onCommand)
chrome.runtime.onMessage.addListener(onMessage)
chrome.runtime.onMessageExternal.addListener(onMessageExternal)
chrome.tabs.onUpdated.addListener(onUpdate)
// chrome.alarms.onAlarm.addListener(onAlarm)
chrome.storage.onChanged.addListener(onChanged)

const githubURL = 'https://github.com/cssnr/playdrift-extension'
// const installURL = 'https://playdrift-extension.cssnr.com/docs/'
const uninstallURL = 'https://playdrift-extension.cssnr.com/uninstall/'

const defaultOptions = {
    // audio: audio,
    showTooltipMouseover: true,
    showMouseover: false,
    radioTopTip: 'tipTopRating',
    // autoUpdatePlayers: false,
    sendOnJoin: false,
    sendSelfOnJoin: false,
    sendPlayerLeft: true,
    sendTeamsChanged: false,
    sendPlayerKicked: false,
    sendSelfKicked: true,
    stickyTeams: true,
    addCancelReadyBtn: true,
    showRoomOptions: true,
    autoUpdateOptions: false,
    roomMinDisplay: false,
    playTurnAudio: false,
    playPlayersAudio: false,
    playTeamsAudio: false,
    playInboxAudio: false,
    playMessageAudio: false,
    playChatSpeech: false,
    autoKickBanned: true,
    autoKickLowRate: false,
    kickLowRate: 40,
    autoKickLowGames: false,
    kickLowGames: 10,
    autoContinueGameEnd: false,
    sendGameStart: false,
    gameStartMessage: 'Good Luck Everyone and Have Fun!',
    showRemainingDominoes: false,
    hideOwnDominoes: false,
    enableCommands: true,
    contextMenu: true,
    showUpdate: false,
}

const defaultCommands = {
    info: `Stats and Rating are hidden in your profile. The web extension lets you to display stats, store game history, auto kick low win rate players, ban users, and much more. Info on GitHub: ${githubURL}`,
    addon: 'info',
    leave: 'When many players are done playing, they join another game, ready up, then leave as soon as it starts for extra points. The !addon provides notifications when players leave and lets you ban them.',
    bot: 'Many of the players on the site are actually robots. Luckily, most of them have a low win rate (sub 40%) and the !addon lets you auto kick players below set win rate to remove most of them.',
}

// const audio = {
//     join: { file: '/audio/join.mp3', volume: 1.0 },
//     leave: { file: '/audio/leave.mp3', volume: 1.0 },
//     message: { file: '/audio/message.mp3', volume: 1.0 },
//     team: { file: '/audio/team.mp3', volume: 1.0 },
//     turn: { file: '/audio/join.mp3', volume: 1.0 },
// }

/**
 * On Startup Callback
 * @function onStartup
 */
function onStartup() {
    console.log('onStartup')
    // if (typeof browser !== 'undefined') {
    //     console.log('FireFox Startup - Fix for Bug')
    //     const { options } = await chrome.storage.sync.get(['options'])
    //     console.debug('options:', options)
    //     if (options.contextMenu) {
    //         createContextMenus()
    //     }
    // }
}

/**
 * On Installed Callback
 * @function onInstalled
 * @param {InstalledDetails} details
 */
async function onInstalled(details) {
    console.log('onInstalled:', details)
    const options = await Promise.resolve(setDefaultOptions())
    console.debug('options:', options)
    if (options.contextMenu) {
        createContextMenus()
    }
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        // await chrome.alarms.create('check-user-profile', {
        //     delayInMinutes: 2,
        //     periodInMinutes: 2,
        // })
        const hasPerms = await chrome.permissions.contains({
            origins: ['*://*.playdrift.com/*'],
        })
        if (hasPerms) {
            chrome.runtime.openOptionsPage()
        } else {
            const url = chrome.runtime.getURL('/html/oninstall.html')
            await chrome.tabs.create({ active: true, url })
        }
        // await chrome.tabs.create({ active: false, url: installURL })
    } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        if (options.showUpdate) {
            const manifest = chrome.runtime.getManifest()
            if (manifest.version !== details.previousVersion) {
                const url = `${githubURL}/releases/tag/${manifest.version}`
                await chrome.tabs.create({ active: false, url })
            }
        }
    }
    await chrome.runtime.setUninstallURL(uninstallURL)
}

/**
 * On Clicked Callback
 * @function onClicked
 * @param {OnClickData} ctx
 * @param {chrome.tabs.Tab} tab
 */
async function onClicked(ctx, tab) {
    console.debug('onClicked:', ctx, tab)
    if (ctx.menuItemId === 'options') {
        chrome.runtime.openOptionsPage()
        // } else if (ctx.menuItemId === 'showPage') {
        //     await chrome.windows.create({
        //         type: 'detached_panel',
        //         url: '/html/page.html',
        //         width: 720,
        //         height: 480,
        //     })
    } else if (ctx.menuItemId === 'openHome') {
        await openHome()
    } else if (ctx.menuItemId === 'playDominoes') {
        await playGame()
    } else {
        console.error(`Unknown ctx.menuItemId: ${ctx.menuItemId}`)
    }
}

/**
 * On Command Callback
 * @function onCommand
 * @param {String} command
 */
async function onCommand(command) {
    console.debug(`onCommand: ${command}`)
    if (command === 'openHome') {
        await openHome()
    } else if (command === 'playGame') {
        await playGame()
    }
}

/**
 * On Message Callback
 * @function onMessage
 * @param {Object} message
 * @param {MessageSender} sender
 * @param {Function} sendResponse
 */
async function onMessage(message, sender, sendResponse) {
    console.debug('onMessage: message, sender:', message, sender)
    // if (message.action) {
    //     const isShown = await chrome.pageAction.isShown({
    //         tabId: sender.tab.id,
    //     })
    //     // console.debug('isShown:', isShown)
    //     if (!isShown) {
    //         console.info('showing icon, sender.tab.id:', sender.tab.id)
    //         chrome.pageAction.show(sender.tab.id)
    //         sendResponse(true)
    //     } else {
    //         sendResponse(false)
    //     }
    // }
}

async function onMessageExternal(message, sender, sendResponse) {
    console.debug('onMessageExternal: message, sender:', message, sender)
    const { profile } = await chrome.storage.sync.get(['profile'])
    sendResponse(profile)
}

/**
 * On Changed Callback
 * TODO: This fires on ALL Tabs and not just the ones in optional host permissions
 * @function onChanged
 * @param {number} tabId
 * @param {Object} changeInfo
 * @param {Tab} tab
 */
async function onUpdate(tabId, changeInfo, tab) {
    // console.debug('onUpdate: tabId, changeInfo, tab:', tabId, changeInfo, tab)
    if (changeInfo.url?.includes('playdrift.com')) {
        try {
            await chrome.tabs.sendMessage(tabId, {
                url: changeInfo.url,
            })
            // console.debug('response:', response)
        } catch (e) {}
    }
}

// chrome.webRequest.onBeforeRequest.addListener(
//     onBeforeRequest,
//     {
//         urls: ['*://*.playdrift.com/*'],
//     },
//     ['requestBody']
// )
//
// function onBeforeRequest(event) {
//     console.log(event)
// }

// /**
//  * On Alarm Callback
//  * @function onAlarm
//  * @param {alarm} alarm
//  */
// async function onAlarm(alarm) {
//     console.info('onAlarm: alarm:', alarm)
//     // const { profile } = await chrome.storage.sync.get(['profile'])
//     // if (!profile) {
//     //     return console.log('no profile in sync storage')
//     // }
//     // try {
//     //     const response = await chrome.runtime.sendMessage({
//     //         userProfile: profile.id,
//     //     })
//     //     console.debug('response:', response)
//     // } catch (e) {
//     //     console.debug(e)
//     // }
// }

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
function onChanged(changes, namespace) {
    // console.debug('onChanged:', changes, namespace)
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (namespace === 'sync' && key === 'options' && oldValue && newValue) {
            if (oldValue.contextMenu !== newValue.contextMenu) {
                if (newValue?.contextMenu) {
                    console.info('Enabled contextMenu...')
                    createContextMenus()
                } else {
                    console.info('Disabled contextMenu...')
                    chrome.contextMenus.removeAll()
                }
            }
        }
    }
}

/**
 * Create Context Menus
 * @function createContextMenus
 */
function createContextMenus() {
    console.debug('createContextMenus')
    chrome.contextMenus.removeAll()
    const ctx = ['all']
    const contexts = [
        [ctx, 'playDominoes', 'normal', 'Play Dominoes'],
        [ctx, 'openHome', 'normal', 'Home Page'],
        // [ctx, 'showPage', 'normal', 'Extension Page'],
        [ctx, 'separator-1', 'separator', 'separator'],
        [ctx, 'options', 'normal', 'Open Options'],
    ]
    contexts.forEach((context) => {
        chrome.contextMenus.create({
            contexts: context[0],
            id: context[1],
            type: context[2],
            title: context[3],
        })
    })
}

/**
 * Set Default Options
 * @function setDefaultOptions
 * @return {Object}
 */
async function setDefaultOptions() {
    console.log('setDefaultOptions', defaultOptions)
    let { banned, commands, history, options, profile } =
        await chrome.storage.sync.get([
            'banned',
            'commands',
            'history',
            'options',
            'profile',
        ])
    if (!banned) {
        banned = []
        await chrome.storage.sync.set({ banned })
    }
    if (!commands) {
        commands = defaultCommands
        await chrome.storage.sync.set({ commands })
    }
    if (!history) {
        history = []
        await chrome.storage.sync.set({ history })
    }
    if (!profile) {
        profile = {}
        await chrome.storage.sync.set({ profile })
    }
    // if (!profiles) {
    //     profiles = {}
    //     await chrome.storage.sync.set({ profiles })
    // }
    options = options || {}
    let changed = false
    for (const [key, value] of Object.entries(defaultOptions)) {
        // console.log(`${key}: default: ${value} current: ${options[key]}`)
        if (options[key] === undefined) {
            changed = true
            options[key] = value
            console.log(`Set ${key}:`, value)
        }
    }
    if (changed) {
        await chrome.storage.sync.set({ options })
        console.log('changed:', options)
    }
    return options
}
