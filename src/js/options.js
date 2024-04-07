// JS for options.html

import {
    checkPerms,
    onChanged,
    openHome,
    saveOptions,
    updateOptions,
} from './export.js'
// import { Picker } from '../dist/emoji-picker-element/index.js'

chrome.storage.onChanged.addListener(onChanged)
document.addEventListener('DOMContentLoaded', initOptions)
document.getElementById('grant-perms').addEventListener('click', grantPerms)
document
    .querySelectorAll('#options-form input')
    .forEach((el) => el.addEventListener('change', saveOptions))
document
    .getElementById('options-form')
    .addEventListener('submit', (e) => e.preventDefault())
document
    .querySelectorAll('.open-oninstall')
    .forEach((el) => el.addEventListener('click', openOnInstall))
document
    .querySelectorAll('.open-home')
    .forEach((el) => el.addEventListener('click', openHome))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

/**
 * Initialize Options
 * @function initOptions
 */
async function initOptions() {
    console.debug('initOptions')
    const manifest = chrome.runtime.getManifest()
    document.querySelector('.version').textContent = manifest.version
    document.querySelector('[href="homepage_url"]').href = manifest.homepage_url

    await setShortcuts({
        mainKey: '_execute_action',
        openHome: 'openHome',
        playGame: 'playGame',
    })

    const { options } = await chrome.storage.sync.get(['options'])
    console.debug('options:', options)
    updateOptions(options)
    await checkPerms()

    // const pickerOptions = { onEmojiSelect: onEmojiSelect }
    // const picker = new EmojiMart.Picker(pickerOptions)
    // document.body.appendChild(picker)

    // const picker = new Picker()
    // document.body.appendChild(picker)
}

// function onEmojiSelect(emojiData, event) {
//     console.debug('onEmojiSelect:', emojiData, event)
// }

/**
 * Grant Permissions Click Callback
 * @function grantPerms
 * @param {MouseEvent} event
 */
async function grantPerms(event) {
    console.debug('grantPermsBtn:', event)
    await chrome.permissions.request({
        origins: ['*://*.playdrift.com/*'],
    })
    await checkPerms()
}

/**
 * Open OnInstall Page Click Callback
 * @function openOnInstall
 * @param {MouseEvent} event
 */
async function openOnInstall(event) {
    console.debug('openOnInstall:', event)
    const url = chrome.runtime.getURL('/html/oninstall.html')
    await chrome.tabs.create({ active: true, url })
    window.close()
}

/**
 * Set Keyboard Shortcuts
 * @function setShortcuts
 * @param {Object} mapping { elementID: name }
 */
async function setShortcuts(mapping) {
    const commands = await chrome.commands.getAll()
    for (const [elementID, name] of Object.entries(mapping)) {
        // console.debug(`${elementID}: ${name}`)
        const command = commands.find((x) => x.name === name)
        if (command?.shortcut) {
            console.debug(`${elementID}: ${command.shortcut}`)
            const el = document.getElementById(elementID)
            if (el) {
                el.textContent = command.shortcut
            }
        }
    }
}

// document
//     .querySelector('emoji-picker')
//     .addEventListener('emoji-click', emojiCallback)
//
// function emojiCallback(event) {
//     console.debug('emojiCallback:', event)
// }
