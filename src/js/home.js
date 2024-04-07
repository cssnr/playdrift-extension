// JS for home.html

import { playGame, updateOptions } from './export.js'

chrome.storage.onChanged.addListener(onChanged)

document.addEventListener('DOMContentLoaded', domContentLoaded)
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

const historyTable = document.getElementById('history-table')

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')
    const { history, options, profile } = await chrome.storage.sync.get([
        'history',
        'options',
        'profile',
    ])
    console.debug('history, options, profile:', history, options, profile)
    updateOptions(profile, true)
    if (!profile || !Object.keys(profile).length) {
        document
            .querySelectorAll('.profile')
            .forEach((el) => el.classList.add('d-none'))
        document.getElementById('no-profile').classList.remove('d-none')
    }
    const tbody = historyTable.querySelector('tbody')
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

async function openOptions(event) {
    console.debug('openOptions:', event)
    event.preventDefault()
    chrome.runtime.openOptionsPage()
}

async function playDominoes(event) {
    console.debug('playDominoes:', event)
    event.preventDefault()
    await playGame()
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
    console.debug('onChanged:', changes, namespace)
    for (const [key, { newValue }] of Object.entries(changes)) {
        if ((namespace === 'sync' && key === 'profile') || key === 'history') {
            console.debug('newValue:', newValue)
            window.location.reload()
        }
    }
}
