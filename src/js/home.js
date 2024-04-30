// JS for home.html

import {
    checkPerms,
    grantPerms,
    showToast,
    tabOpen,
    updateOptions,
} from './export.js'

chrome.storage.onChanged.addListener(onChanged)
chrome.permissions.onAdded.addListener(onAdded)

document.addEventListener('DOMContentLoaded', domContentLoaded)
document.getElementById('grant-perms').addEventListener('click', grantPerms)
document
    .querySelectorAll('[data-tabopen]')
    .forEach((el) => el.addEventListener('click', tabOpen))

document
    .getElementById('export-banned')
    .addEventListener('click', exportBannedUsers)
document
    .getElementById('import-banned')
    .addEventListener('click', importBannedUsers)

document.getElementById('banned-form').addEventListener('submit', addBannedUser)

const historyTable = document.getElementById('history-table')
const bannedTable = document.getElementById('banned-table')
const bannedInput = document.getElementById('banned-input')

bannedInput.addEventListener('change', inputBannedUsers)

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')
    const { banned, history, profile } = await chrome.storage.sync.get([
        'banned',
        'history',
        'profile',
    ])
    const manifest = chrome.runtime.getManifest()
    document.querySelector('.version').textContent = manifest.version
    document.querySelector('[href="homepage_url"]').href = manifest.homepage_url
    showProfile(profile)
    updateOptions(profile, true)
    updateHistory(history)
    updateBanned(banned)
    await checkPerms()
}

function showProfile(profile) {
    if (!profile || !Object.keys(profile).length) {
        document
            .querySelectorAll('.profile')
            .forEach((el) => el.classList.add('d-none'))
        document.getElementById('no-profile').classList.remove('d-none')
    }
}

/**
 * Update History Table
 * @function updateHistory
 * @param {Array} history
 */
function updateHistory(history) {
    console.debug('updateHistory:', history)
    const tbody = historyTable.querySelector('tbody')
    tbody.innerHTML = ''
    const tr = historyTable.querySelector('tfoot tr')
    history
        .slice()
        .reverse()
        .forEach((x) => {
            const date = new Date(x.ts_last)
            const row = tr.cloneNode(true)
            if (x.win) {
                row.cells[1].classList.add('text-success')
                row.cells[2].classList.add('text-success-emphasis')
            } else {
                row.cells[1].classList.add('text-danger')
                row.cells[2].classList.add('text-danger-emphasis')
            }
            row.cells[0].textContent = date.toLocaleString()
            row.cells[1].textContent = x.win ? 'Win' : 'Loss'
            row.cells[2].textContent = x.rating
            row.cells[3].textContent = x.games_won
            row.cells[3].classList.add('text-success-emphasis')
            row.cells[4].textContent = x.games_lost
            row.cells[4].classList.add('text-danger-emphasis')
            row.cells[5].textContent = x.games_won + x.games_lost
            tbody.appendChild(row)
        })
}

/**
 * Update Filters Table
 * @function updateBanned
 * @param {Array} banned
 */
function updateBanned(banned) {
    console.debug('updateBanned:', banned)
    const tbody = bannedTable.querySelector('tbody')
    tbody.innerHTML = ''
    const trashCan = document.querySelector('.fa-regular.fa-trash-can')
    banned.forEach((value) => {
        const row = tbody.insertRow()
        const button = document.createElement('a')
        const svg = trashCan.cloneNode(true)
        button.appendChild(svg)
        button.title = 'Delete'
        button.dataset.id = value
        button.classList.add('link-danger')
        button.setAttribute('role', 'button')
        button.addEventListener('click', deleteBanned)
        const cell1 = row.insertCell()
        cell1.classList.add('text-center', 'align-middle')
        // cell1.dataset.idx = i.toString()
        cell1.appendChild(button)

        const link = document.createElement('a')
        // link.dataset.idx = idx
        link.text = value
        link.title = value
        link.classList.add(
            'link-body-emphasis',
            'link-underline',
            'link-underline-opacity-0'
        )
        link.target = '_blank'
        link.href = `https://dominoes.playdrift.com/?profile=${value}`
        link.setAttribute('role', 'button')

        const cell2 = row.insertCell()
        // cell2.id = `td-banned-${i}`
        // cell2.dataset.idx = i.toString()
        cell2.classList.add('text-break')
        cell2.setAttribute('role', 'button')
        cell2.appendChild(link)
    })
}

/**
 * Add Banned User Submit Callback
 * @function addBannedUser
 * @param {SubmitEvent} event
 */
async function addBannedUser(event) {
    console.debug('addBannedUser:', event)
    event.preventDefault()
    // const element = document.querySelector('#banned-form input')
    const input = document.getElementById('add-banned')
    const user = input.value.trim()
    console.log(`user: ${user}`)
    const regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    // if (user.length !== 36) {
    if (!regex.test(user)) {
        showToast('You must provide a valid User ID.', 'danger')
        input.focus()
        return
    }
    const { banned } = await chrome.storage.sync.get(['banned'])
    if (!banned.includes(user)) {
        banned.push(user)
        console.debug('banned:', banned)
        await chrome.storage.sync.set({ banned })
        updateBanned(banned)
        showToast(`Added Banned User.`, 'success')
    } else {
        showToast(`User Already Banned.`, 'warning')
    }
    input.value = ''
    input.focus()
}

/**
 * Export Banned Users Click Callback
 * @function exportBannedUsers
 * @param {MouseEvent} event
 */
async function exportBannedUsers(event) {
    console.debug('exportBannedUsers:', event)
    event.preventDefault()
    const { banned } = await chrome.storage.sync.get(['banned'])
    console.debug('banned:', banned)
    if (!banned) {
        return showToast('No Banned Users Found!', 'warning')
    }
    const json = JSON.stringify(banned)
    textFileDownload('banned-users.txt', json)
}

/**
 * Import Banned Users Click Callback
 * @function importBannedUsers
 * @param {MouseEvent} event
 */
async function importBannedUsers(event) {
    console.debug('importBannedUsers:', event)
    event.preventDefault()
    bannedInput.click()
}

/**
 * Banned Users Input Change Callback
 * @function inputBannedUsers
 * @param {InputEvent} event
 */
async function inputBannedUsers(event) {
    console.debug('inputBannedUsers:', event, bannedInput)
    event.preventDefault()
    const fileReader = new FileReader()
    fileReader.onload = async function doBannedImport() {
        const result = JSON.parse(fileReader.result.toString())
        console.debug('result:', result)
        const { banned } = await chrome.storage.sync.get(['banned'])
        let count = 0
        for (const pid of result) {
            if (!banned.includes(pid)) {
                banned.push(pid)
                count += 1
            }
        }
        showToast(`Imported ${count}/${result.length} Banned Users.`, 'success')
        await chrome.storage.sync.set({ banned })
    }
    fileReader.readAsText(bannedInput.files[0])
}

/**
 * Delete Banned User Click Callback
 * @function deleteBanned
 * @param {MouseEvent} event
 */
async function deleteBanned(event) {
    console.debug('deleteBanned:', event)
    event.preventDefault()
    const { banned } = await chrome.storage.sync.get(['banned'])
    // console.debug('banned:', banned)
    const anchor = event.target.closest('a')
    const playerID = anchor?.dataset?.id
    console.debug(`playerID: ${playerID}`)
    let index
    if (playerID && banned.includes(playerID)) {
        index = banned.indexOf(playerID)
    }
    console.debug(`index: ${index}`)
    if (index !== undefined) {
        banned.splice(index, 1)
        await chrome.storage.sync.set({ banned })
        showToast(`Removed Banned User.`, 'success')
    } else {
        showToast(`User Not Found.`, 'warning')
    }
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
export function onChanged(changes, namespace) {
    // console.debug('onChanged:', changes, namespace)
    for (const [key, { newValue }] of Object.entries(changes)) {
        if (namespace === 'sync') {
            // console.debug('key:', key, newValue)
            if (key === 'profile') {
                // TODO: This should reload if profile changed from empty to set
                const noProfile = document.getElementById('no-profile')
                if (!noProfile.classList.contains('d-none')) {
                    window.location.reload()
                }
            } else if (key === 'history') {
                updateHistory(newValue)
            } else if (key === 'banned') {
                updateBanned(newValue)
            }
        }
    }
}

/**
 * Permissions On Added Callback
 * @param permissions
 */
async function onAdded(permissions) {
    console.info('onAdded', permissions)
    await checkPerms()
}
