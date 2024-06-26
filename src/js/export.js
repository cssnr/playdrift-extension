// JS Exports

/**
 * Open Game Tab
 * TODO: To be replaced with: tabOpen
 *       Only used in SW onClicked and onCommand
 * @function playGame
 * @param {MouseEvent} event
 */
export async function playGame(event = null) {
    event?.preventDefault()
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        url: '*://*.playdrift.com/*',
    })
    console.log('tabs:', tabs)
    if (tabs.length) {
        await chrome.tabs.update(tabs[0].id, { active: true })
    } else {
        const url = 'https://dominoes.playdrift.com/'
        await chrome.tabs.create({ active: true, url })
    }
}

/**
 * Open Game Tab
 * TODO: To be replaced with: tabOpen
 *       Only used in SW onClicked and onCommand
 * @function playGame
 * @param {MouseEvent} event
 */
export async function openHome(event = null) {
    event?.preventDefault()
    const url = chrome.runtime.getURL('/html/home.html')
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        url: url,
    })
    // console.debug('tabs:', tabs)
    if (tabs.length) {
        await chrome.tabs.update(tabs[0].id, { active: true })
    } else {
        await chrome.tabs.create({ active: true, url })
    }
}

/**
 * Tab Open Callback
 * TODO: This Replaces playGame and openHome in all places but
 *      1. The context menu clicks: onClicked
 *      2. Keyboard shortcut commands: onCommand
 * @function focusOpen
 * @param {MouseEvent} event
 */
export async function tabOpen(event) {
    console.debug('tabOpen', event)
    event?.preventDefault()
    const element = event?.target?.closest('a')
    // console.debug('element', element)
    const url = element?.href
    // console.debug('url', url)
    const pattern = element?.dataset?.tabopen || url
    console.debug('pattern', pattern)
    if (!pattern) {
        return console.warn('no pattern for tabOpen event:', event)
    }
    const queryInfo = {
        currentWindow: true,
        url: pattern,
    }
    const tabs = await chrome.tabs.query(queryInfo)
    // console.debug('tabs:', tabs)
    if (tabs.length) {
        await chrome.tabs.update(tabs[0].id, { active: true })
    } else {
        await chrome.tabs.create({ active: true, url: url })
    }
}

/**
 * Request Host Permissions
 * @function requestPerms
 * @return {chrome.permissions.request}
 */
export async function requestPerms() {
    return await chrome.permissions.request({
        origins: ['*://*.playdrift.com/*'],
    })
}

/**
 * Grant Permissions Click Callback
 * Shared with Options and Home
 * @function grantPerms
 * @param {MouseEvent} event
 */
export async function grantPerms(event) {
    console.debug('grantPerms:', event)
    await requestPerms()
    await checkPerms()
}

/**
 * Check Host Permissions
 * @function checkPerms
 * @return {Boolean}
 */
export async function checkPerms() {
    const hasPerms = await chrome.permissions.contains({
        origins: ['*://*.playdrift.com/*'],
    })
    console.debug('checkPerms:', hasPerms)
    // Firefox still uses DOM Based Background Scripts
    if (typeof document === 'undefined') {
        return hasPerms
    }
    const hasPermsEl = document.querySelectorAll('.has-perms')
    const grantPermsEl = document.querySelectorAll('.grant-perms')
    if (hasPerms) {
        hasPermsEl.forEach((el) => el.classList.remove('d-none'))
        grantPermsEl.forEach((el) => el.classList.add('d-none'))
    } else {
        grantPermsEl.forEach((el) => el.classList.remove('d-none'))
        hasPermsEl.forEach((el) => el.classList.add('d-none'))
    }
    return hasPerms
}

/**
 * Save Options Callback
 * @function saveOptions
 * @param {InputEvent} event
 */
export async function saveOptions(event) {
    console.debug('saveOptions:', event)
    const { options } = await chrome.storage.sync.get(['options'])
    let key = event.target.id
    let value
    if (key === 'kickLowRate') {
        const number = parseInt(event.target.value, 10)
        if (!isNaN(number) && number >= 1 && number <= 99) {
            event.target.value = number.toString()
            value = number
        } else {
            event.target.value = options[key]
            // TODO: Add Error Handling
        }
    } else if (event.target.type === 'radio') {
        key = event.target.name
        const radios = document.getElementsByName(key)
        for (const input of radios) {
            if (input.checked) {
                value = input.id
                break
            }
        }
    } else if (event.target.type === 'checkbox') {
        value = event.target.checked
    } else if (event.target.type === 'number') {
        value = event.target.value.toString()
    } else {
        value = event.target.value
    }
    if (value !== undefined) {
        options[key] = value
        console.info(`Set: ${key}:`, value)
        await chrome.storage.sync.set({ options })
    } else {
        console.warn('No Value for key:', key)
    }
}

/**
 * Update Options based on typeof
 * @function initOptions
 * @param {Object} options
 * @param {boolean} text
 */
export function updateOptions(options, text = false) {
    console.debug('updateOptions:', options)
    for (let [key, value] of Object.entries(options)) {
        if (key.startsWith('radio')) {
            key = value
            value = true
        }
        // console.debug(`${key}: ${value}`)
        const el = document.getElementById(key)
        if (!el) {
            continue
        }
        if (text) {
            el.textContent = value.toString()
        } else if (typeof value === 'boolean') {
            el.checked = value
        } else if (typeof value === 'object') {
            console.debug(`Options Object for: ${key}`, value)
        } else {
            el.value = value
        }
        if (el.dataset.related) {
            hideShowElement(`#${el.dataset.related}`, value)
        }
        // if (el.dataset.audio) {
        //     hideShowElement(`#${el.dataset.related}`, value)
        // }
    }
}

// /**
//  * Update Options based on typeof
//  * @function initOptions
//  * @param {HTMLElement} el
//  */
// function addAudioElement(el) {
//     const div = document.getElementById('audio-options').cloneNode(true)
//     el.parentNode.insertBefore(el)
// }

function hideShowElement(selector, show, speed = 'fast') {
    const element = $(`${selector}`)
    // console.debug('hideShowElement:', show, element)
    if (show) {
        element.show(speed)
    } else {
        element.hide(speed)
    }
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
export function onChanged(changes, namespace) {
    console.debug('onChanged:', changes, namespace)
    for (const [key, { newValue }] of Object.entries(changes)) {
        if (namespace === 'sync' && key === 'options') {
            console.debug('newValue:', newValue)
            updateOptions(newValue)
        }
    }
}

/**
 * Show Bootstrap Toast
 * @function showToast
 * @param {String} message
 * @param {String} type
 */
export function showToast(message, type = 'success') {
    console.debug(`showToast: ${type}: ${message}`)
    const clone = document.querySelector('.d-none .toast')
    const container = document.getElementById('toast-container')
    if (!clone || !container) {
        return console.warn('Missing clone or container:', clone, container)
    }
    const element = clone.cloneNode(true)
    element.querySelector('.toast-body').innerHTML = message
    element.classList.add(`text-bg-${type}`)
    container.appendChild(element)
    const toast = new bootstrap.Toast(element)
    element.addEventListener('mousemove', () => toast.hide())
    toast.show()
}
