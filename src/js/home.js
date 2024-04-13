// JS for home.html

import {
    checkPerms,
    grantPerms,
    playGame,
    showToast,
    updateOptions,
} from './export.js'

chrome.storage.onChanged.addListener(onChanged)

document.addEventListener('DOMContentLoaded', domContentLoaded)
document.getElementById('grant-perms').addEventListener('click', grantPerms)
document.getElementById('banned-form').addEventListener('submit', addBannedUser)
document
    .getElementById('export-banned')
    .addEventListener('click', exportBannedUsers)
document
    .getElementById('import-banned')
    .addEventListener('click', importBannedUsers)
document
    .querySelectorAll('.open-options')
    .forEach((el) => el.addEventListener('click', openOptions))
document
    .querySelectorAll('.play-dominoes')
    .forEach((el) => el.addEventListener('click', playDominoes))

// document
//     .querySelectorAll('.open-page')
//     .forEach((el) => el.addEventListener('click', openPage))

// document.addEventListener('focus', onFocus)
// function onFocus(e) {
//     window.location.reload()
// }

const bannedInput = document.getElementById('import-banned-input')
const historyTable = document.getElementById('history-table')

bannedInput.addEventListener('change', bannedInputChange)

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    const { banned, history, options, profile } = await chrome.storage.sync.get(
        ['banned', 'history', 'options', 'profile']
    )
    console.debug('domContentLoaded:', banned, history, options, profile)
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
    const tbody = document.querySelector('#banned-table tbody')
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
    if (user.length !== 36) {
        showToast('You must provide a valid User ID.', 'danger')
    } else {
        console.log(`user: ${user}`)
        const { banned } = await chrome.storage.sync.get(['banned'])
        if (!banned.includes(user)) {
            banned.push(user)
            console.debug('banned:', banned)
            await chrome.storage.sync.set({ banned })
            updateBanned(banned)
        }
        input.value = ''
    }
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
    download('banned-users.txt', json)
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
 * @function bannedInputChange
 * @param {InputEvent} event
 */
async function bannedInputChange(event) {
    console.debug('bannedInputChange:', event, bannedInput)
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
        // console.debug('banned:', banned)
        updateBanned(banned)
        // document.getElementById('add-filter').focus()
    }
}

async function openOptions(event) {
    console.debug('openOptions:', event)
    event.preventDefault()
    chrome.runtime.openOptionsPage()
}

async function playDominoes(event) {
    console.debug('playDominoes:', event)
    event.preventDefault()
    await playGame(event)
}

// async function openPage(event) {
//     console.debug('openPage:', event)
//     event.preventDefault()
//     await chrome.windows.create({
//         type: 'detached_panel',
//         url: '/html/page.html',
//         width: 720,
//         height: 480,
//     })
// }

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
            console.debug('key:', key, newValue)
            if (key === 'profile') {
                // TODO: This should reload if profile changed from empty to set
                const noProfile = document.getElementById('no-profile')
                if (!noProfile.classList.contains('d-none')) {
                    // showProfile(newValue)
                    // updateOptions(newValue, true)
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
 * Download filename with text
 * @function download
 * @param {String} filename
 * @param {String} text
 */
function download(filename, text) {
    console.debug(`download: ${filename}`)
    const element = document.createElement('a')
    element.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
    )
    element.setAttribute('download', filename)
    element.classList.add('d-none')
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
}
