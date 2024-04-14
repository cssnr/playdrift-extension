// JS for popup.html

import {
    checkPerms,
    onChanged,
    saveOptions,
    showToast,
    tabOpen,
    updateOptions,
} from './export.js'

chrome.storage.onChanged.addListener(onChanged)

document.addEventListener('DOMContentLoaded', initPopup)
document.getElementById('grant-perms').addEventListener('click', grantPerms)
// document.getElementById('inject-script').addEventListener('click', injectScript)
document
    .querySelectorAll('a[href]')
    .forEach((el) => el.addEventListener('click', popupLinks))
document
    .querySelectorAll('#options-form input')
    .forEach((el) => el.addEventListener('change', saveOptions))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

/**
 * Initialize Popup
 * @function initPopup
 */
async function initPopup() {
    console.debug('initPopup')
    const manifest = chrome.runtime.getManifest()
    document.querySelector('.version').textContent = manifest.version
    document.querySelector('[href="homepage_url"]').href = manifest.homepage_url

    await checkPerms()

    const { options, profile } = await chrome.storage.sync.get([
        'options',
        'profile',
    ])
    console.debug('options, profile:', options, profile)
    updateOptions(options)
    updateOptions(profile, true)

    if (!profile || !Object.keys(profile).length) {
        document
            .querySelectorAll('.profile')
            .forEach((el) => el.classList.add('d-none'))
        document.getElementById('no-profile').classList.remove('d-none')
    }

    if (chrome.runtime.lastError) {
        showToast(chrome.runtime.lastError.message, 'warning')
    }

    // const platformInfo = await chrome.runtime.getPlatformInfo()
    // console.log('platformInfo:', platformInfo)

    // const views = chrome.extension.getViews()
    // console.log('views:', views)
    // const result = views.find((item) => item.location.href.endsWith('html/home.html'))
    // console.log('result:', result)
}

/**
 * Popup Links Click Callback
 * Firefox requires a call to window.close()
 * @function popupLinks
 * @param {MouseEvent} event
 */
async function popupLinks(event) {
    console.debug('popupLinks:', event)
    event.preventDefault()
    const anchor = event.target.closest('a')
    console.debug(`anchor.href: ${anchor.href}`)
    let url
    if (anchor.href.endsWith('html/options.html')) {
        chrome.runtime.openOptionsPage()
        return window.close()
    } else if (anchor.href.endsWith('html/page.html')) {
        await chrome.windows.create({
            type: 'detached_panel',
            url: '/html/page.html',
            width: 720,
            height: 480,
        })
        return window.close()
    } else if (anchor.dataset.open) {
        await tabOpen(event)
        return window.close()
        // } else if (anchor.href.endsWith('html/home.html')) {
        //     await openHome()
        //     return window.close()
        // } else if (anchor.href.includes('dominoes.playdrift.com')) {
        //     await playGame()
        //     return window.close()
    } else if (
        anchor.href.startsWith('http') ||
        anchor.href.startsWith('chrome-extension')
    ) {
        console.debug(`http or chrome-extension`)
        url = anchor.href
    } else {
        console.debug(`else chrome.runtime.getURL`)
        url = chrome.runtime.getURL(anchor.href)
    }
    console.debug('url:', url)
    await chrome.tabs.create({ active: true, url })
    return window.close()
}

/**
 * Grant Permissions Button Click Callback
 * @function grantPerms
 * @param {Event} event
 */
function grantPerms(event) {
    console.debug('grantPerms:', event)
    chrome.permissions.request({
        origins: ['*://*.playdrift.com/*'],
    })
    window.close()
}

// /**
//  * Grant Permissions Button Click Callback
//  * @function injectScript
//  * @param {MouseEvent} event
//  */
// async function injectScript(event) {
//     console.debug('injectScript:', event)
//     const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
//     try {
//         await chrome.scripting.executeScript({
//             target: { tabId: tab.id },
//             files: ['/js/inject.js'],
//         })
//         window.close()
//     } catch (e) {
//         showToast(e.toString(), 'danger')
//         console.info(e)
//     }
// }
