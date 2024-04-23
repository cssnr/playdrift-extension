// JS for oninstall.html

import { checkPerms, tabOpen } from './export.js'

document.addEventListener('DOMContentLoaded', domContentLoaded)
document.getElementById('grant-perms').addEventListener('click', grantPerms)
document
    .querySelectorAll('[data-tabopen]')
    .forEach((el) => el.addEventListener('click', tabOpen))

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')
    await checkPerms()
}

/**
 * Grant Permissions Click Callback
 * @function grantPerms
 * @param {MouseEvent} event
 */
async function grantPerms(event) {
    console.debug('grantPerms:', event)
    await chrome.permissions.request({
        origins: ['*://*.playdrift.com/*'],
    })
    const hasPerms = await checkPerms()
    if (hasPerms) {
        chrome.runtime.openOptionsPage()
        window.close()
    }
}
