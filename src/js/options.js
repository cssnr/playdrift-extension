// JS for options.html

import {
    checkPerms,
    grantPerms,
    onChanged,
    saveOptions,
    showToast,
    tabOpen,
    updateOptions,
} from './export.js'
// import { Picker } from '../dist/emoji-picker-element/index.js'

const bannedTable = document.getElementById('banned-table')

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
    .querySelectorAll('[data-tabopen]')
    .forEach((el) => el.addEventListener('click', tabOpen))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

document.getElementById('cmd-form').addEventListener('submit', addCommand)

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

    const { commands, options } = await chrome.storage.sync.get([
        'commands',
        'options',
    ])
    console.debug('options:', options)
    updateOptions(options)
    updateCommands(commands)
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

/**
 * Update Filters Table
 * @function updateCommands
 * @param {Array} commands
 */
function updateCommands(commands) {
    console.debug('updateCommands:', commands)
    const tbody = bannedTable.querySelector('tbody')
    tbody.innerHTML = ''
    // commands.forEach((value, i) => {
    for (const [key, value] of Object.entries(commands)) {
        console.debug(`commands:`, key, value)
        const row = bannedTable.querySelector('tfoot tr').cloneNode(true)
        tbody.appendChild(row)
        const button = row.cells[0].querySelector('a')
        // button.dataset.idx = i.toString()
        button.dataset.key = key
        button.addEventListener('click', deleteCommand)
        row.cells[1].textContent = key
        row.cells[2].textContent = value
    }
    // })
}

/**
 * Add Command Submit Callback
 * @function addCommand
 * @param {SubmitEvent} event
 */
async function addCommand(event) {
    console.debug('addCommand:', event)
    event.preventDefault()
    // const element = document.querySelector('#banned-form input')
    const cmdName = document.getElementById('cmd-name')
    const cmdResp = document.getElementById('cmd-resp')
    const command = cmdName.value.toLowerCase().trim().replaceAll(' ', '')
    const response = cmdResp.value.trim()
    const { commands } = await chrome.storage.sync.get(['commands'])
    if (!command || !response) {
        return showToast('You must provide a command and response.', 'danger')
    }
    if (commands[command] === response) {
        return showToast('No Change Detected.', 'warning')
    }
    if (commands[command]) {
        showToast(`Updated Command: ${command}.`, 'success')
    }
    commands[command] = response
    // console.debug('commands:', commands)
    await chrome.storage.sync.set({ commands })
    updateCommands(commands)
}

/**
 * Delete Command Click Callback
 * @function deleteCommand
 * @param {MouseEvent} event
 */
async function deleteCommand(event) {
    console.debug('deleteCommand:', event)
    event.preventDefault()
    const anchor = event.target.closest('a')
    // console.debug('anchor:', anchor)
    const key = anchor.dataset.key
    console.debug('key:', key)
    const { commands } = await chrome.storage.sync.get(['commands'])
    // console.debug('commands:', commands)
    if (commands[key] !== undefined) {
        delete commands[key]
        await chrome.storage.sync.set({ commands })
        // console.debug('commands:', commands)
        updateCommands(commands)
        // document.getElementById('add-filter').focus()
    }
}
