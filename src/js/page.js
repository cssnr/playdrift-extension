// JS for home.html

document.addEventListener('DOMContentLoaded', domContentLoaded)

document.getElementById('close').addEventListener('click', closePage)

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')
    const { options } = await chrome.storage.sync.get(['options'])
    console.debug('options:', options)
}

function closePage(event) {
    console.debug('closePage:', event)
    event.preventDefault()
    chrome.windows.remove(chrome.windows.WINDOW_ID_CURRENT)
}
