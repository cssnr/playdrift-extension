// JS for options.html

import {
    checkPerms,
    grantPerms,
    saveOptions,
    showToast,
    tabOpen,
    updateOptions,
} from './export.js'

// import { Picker } from '../dist/emoji-picker-element/index.js'

chrome.storage.onChanged.addListener(onChanged)
chrome.permissions.onAdded.addListener(onAdded)

document.addEventListener('DOMContentLoaded', initOptions)
document.getElementById('grant-perms').addEventListener('click', grantPerms)
document
    .querySelectorAll('.options input')
    .forEach((el) => el.addEventListener('change', saveOptions))
document
    .querySelectorAll('form.options')
    .forEach((el) => el.addEventListener('submit', (e) => e.preventDefault()))

document
    .querySelectorAll('[data-tabopen]')
    .forEach((el) => el.addEventListener('click', tabOpen))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

document
    .getElementById('export-commands')
    .addEventListener('click', exportCustomCommands)
document
    .getElementById('import-commands')
    .addEventListener('click', importCustomCommands)

document.getElementById('cmd-form').addEventListener('submit', addCommand)

const commandsTable = document.getElementById('commands-table')
const commandsInput = document.getElementById('commands-input')

commandsInput.addEventListener('change', inputCustomCommands)

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
    // console.debug('commands, options:', commands, options)
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

// document
//     .querySelector('emoji-picker')
//     .addEventListener('emoji-click', emojiCallback)
//
// function emojiCallback(event) {
//     console.debug('emojiCallback:', event)
// }

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
            // console.debug(`${elementID}: ${command.shortcut}`)
            const el = document.getElementById(elementID)
            if (el) {
                el.textContent = command.shortcut
            }
        }
    }
}

/**
 * Update Filters Table
 * @function updateCommands
 * @param {Array} commands
 */
function updateCommands(commands) {
    console.debug('updateCommands:', commands)
    const tbody = commandsTable.querySelector('tbody')
    tbody.innerHTML = ''
    // commands.forEach((value, i) => {
    for (const [key, value] of Object.entries(commands)) {
        // console.debug(`commands:`, key, value)
        const row = commandsTable.querySelector('tfoot tr').cloneNode(true)
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
    let command = cmdName.value.toLowerCase().trim().replaceAll(' ', '')
    if (command.startsWith('!')) {
        command = command.replace('!', '')
    }
    let response = cmdResp.value.trim()
    const { commands } = await chrome.storage.sync.get(['commands'])
    if (!command || !response) {
        return showToast('You must provide a command and response.', 'danger')
    }
    if (commands[command] === response) {
        return showToast('No Change Detected.', 'warning')
    }
    let updated
    if (commands[command]) {
        updated = true
    }
    commands[command] = response
    // console.debug('commands:', commands)
    await chrome.storage.sync.set({ commands })
    updateCommands(commands)
    if (updated) {
        showToast(`Updated Command: ${command}.`, 'success')
    } else {
        showToast(`Added Command: ${command}.`, 'success')
    }
    cmdName.value = ''
    cmdResp.value = ''
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
        // updateCommands(commands)
        // document.getElementById('add-filter').focus()
    }
}

/**
 * Export Custom Commands Click Callback
 * @function exportCustomCommands
 * @param {MouseEvent} event
 */
async function exportCustomCommands(event) {
    console.debug('exportCustomCommands:', event)
    event.preventDefault()
    const { commands } = await chrome.storage.sync.get(['commands'])
    console.debug('commands:', commands)
    if (!commands) {
        return showToast('No Commands Found!', 'warning')
    }
    const json = JSON.stringify(commands)
    textFileDownload('commands.txt', json)
}

/**
 * Import Custom Commands Click Callback
 * @function importCustomCommands
 * @param {MouseEvent} event
 */
async function importCustomCommands(event) {
    console.debug('importCustomCommands:', event)
    event.preventDefault()
    commandsInput.click()
}

/**
 * Custom Commands Input Change Callback
 * @function inputCustomCommands
 * @param {InputEvent} event
 */
async function inputCustomCommands(event) {
    console.debug('inputCustomCommands:', event, commandsInput)
    event.preventDefault()
    const fileReader = new FileReader()
    fileReader.onload = async function doBannedImport() {
        const result = JSON.parse(fileReader.result.toString())
        console.debug('result:', result)
        const { commands } = await chrome.storage.sync.get(['commands'])
        let count = 0
        for (const [key, value] of Object.entries(result)) {
            commands[key] = value
            count += 1
        }
        showToast(
            `Imported ${count}/${Object.keys(result).length} Commands.`,
            'success'
        )
        await chrome.storage.sync.set({ commands })
    }
    fileReader.readAsText(commandsInput.files[0])
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
function onChanged(changes, namespace) {
    // console.debug('onChanged:', changes, namespace)
    for (const [key, { newValue }] of Object.entries(changes)) {
        if (namespace === 'sync') {
            // console.debug('key:', key, newValue)
            if (key === 'options') {
                updateOptions(newValue)
            } else if (key === 'commands') {
                updateCommands(newValue)
            }
        }
    }
}

/**
 * Permissions On Added Callback
 * @param permissions
 */
async function onAdded(permissions) {
    console.debug('onAdded', permissions)
    await checkPerms()
}
