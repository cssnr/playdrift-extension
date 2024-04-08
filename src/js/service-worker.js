// JS Background Service Worker

import { openHome, playGame } from './export.js'

chrome.runtime.onStartup.addListener(onStartup)
chrome.runtime.onInstalled.addListener(onInstalled)
chrome.contextMenus.onClicked.addListener(onClicked)
chrome.commands.onCommand.addListener(onCommand)
chrome.runtime.onMessage.addListener(onMessage)
chrome.tabs.onUpdated.addListener(onUpdate)
// chrome.alarms.onAlarm.addListener(onAlarm)
chrome.storage.onChanged.addListener(onChanged)

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
    const githubURL = 'https://github.com/smashedr/playdrift-extension'
    const options = await Promise.resolve(
        setDefaultOptions({
            showTooltipMouseover: true,
            showMouseover: false,
            sendOnJoin: false,
            sendSelfOnJoin: false,
            autoUpdateOptions: false,
            // sendMouseover: false,
            playTurnAudio: false,
            playPlayersAudio: false,
            playMessageAudio: false,
            playChatSpeech: false,
            autoKickLowRate: false,
            kickLowRate: 40,
            sendGameStart: false,
            gameStartMessage: 'Game Start. Good Luck Everyone and Have Fun!',
            contextMenu: true,
            showUpdate: false,
        })
    )
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
    } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        if (options.showUpdate) {
            const manifest = chrome.runtime.getManifest()
            if (manifest.version !== details.previousVersion) {
                const url = `${githubURL}/releases/tag/${manifest.version}`
                await chrome.tabs.create({ active: false, url })
            }
        }
    }
    await chrome.runtime.setUninstallURL(`${githubURL}/issues`)
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
            const response = await chrome.tabs.sendMessage(tabId, {
                url: changeInfo.url,
            })
            console.debug('response:', response)
        } catch (e) {
            console.debug(e)
        }
    }
}

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
 * @param {Object} defaultOptions
 * @return {Object}
 */
async function setDefaultOptions(defaultOptions) {
    console.log('setDefaultOptions', defaultOptions)
    let { banned, history, options, profile } = await chrome.storage.sync.get([
        'banned',
        'history',
        'options',
        'profile',
    ])
    if (!banned) {
        banned = []
        await chrome.storage.sync.set({ banned })
    }
    if (!history) {
        history = []
        await chrome.storage.sync.set({ history })
    }
    if (!profile) {
        profile = {}
        await chrome.storage.sync.set({ profile })
    }
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
