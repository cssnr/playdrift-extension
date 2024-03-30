// JS for home.html

document.addEventListener('DOMContentLoaded', domContentLoaded)
document
    .querySelectorAll('.open-options')
    .forEach((el) => el.addEventListener('click', openOptions))
// document
//     .querySelectorAll('.open-page')
//     .forEach((el) => el.addEventListener('click', openPage))

const historyTable = document.getElementById('history-table')

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')
    // const { options } = await chrome.storage.sync.get(['options'])
    // console.debug('options:', options)
    const { history } = await chrome.storage.sync.get(['history'])
    console.debug('history:', history)
    const tbody = historyTable.querySelector('tbody')
    const tr = historyTable.querySelector('tfoot tr')
    history
        .slice()
        .reverse()
        .forEach((x) => {
            console.log('item:', x)
            const date = new Date(x.ts_last)
            const row = tr.cloneNode(true)
            console.log('row:', row)
            if (x.win) {
                row.cells[1].classList.add('text-success')
            } else {
                row.cells[1].classList.add('text-danger')
            }
            row.cells[0].textContent = date.toLocaleString()
            row.cells[1].textContent = x.win ? 'Win' : 'Loss'
            row.cells[2].textContent = x.rating
            row.cells[3].textContent = x.games_won
            row.cells[3].classList.add('text-success-emphasis')
            row.cells[4].textContent = x.games_lost
            row.cells[4].classList.add('text-danger-emphasis')
            tbody.appendChild(row)
        })
}

async function openOptions(event) {
    console.debug('openOptions:', event)
    event.preventDefault()
    chrome.runtime.openOptionsPage()
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
