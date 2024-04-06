// JS Exports

/**
 * Open Game Tab
 * @function playGame
 */
export async function playGame() {
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
 * @function playGame
 */
export async function openHome() {
    const url = chrome.runtime.getURL('/html/home.html')
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        url: url,
    })
    console.log('tabs:', tabs)
    if (tabs.length) {
        await chrome.tabs.update(tabs[0].id, { active: true })
    } else {
        await chrome.tabs.create({ active: true, url })
    }
}

/**
 * Check Host Permissions
 * @function checkPerms
 * @return {Boolean}
 */
export async function checkPerms() {
    const hasPermsEl = document.querySelectorAll('.has-perms')
    const grantPermsEl = document.querySelectorAll('.grant-perms')
    const hasPerms = await chrome.permissions.contains({
        origins: ['*://*.playdrift.com/*'],
    })
    console.debug('checkPerms:', hasPerms)
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
    let value
    if (event.target.id === 'kickLowRate') {
        const number = parseInt(event.target.value, 10)
        console.log('kickLowRate:', number)
        if (!isNaN(number) && number >= 1 && number <= 99) {
            event.target.value = number.toString()
            value = number
        } else {
            event.target.value = options[event.target.id]
            // TODO: Add Error Handling
        }
    } else if (event.target.type === 'checkbox') {
        value = event.target.checked
    } else if (event.target.type === 'number') {
        value = event.target.value.toString()
    } else {
        value = event.target.value
    }
    if (value !== undefined) {
        options[event.target.id] = value
        console.info(`Set: ${event.target.id}:`, value)
        await chrome.storage.sync.set({ options })
    } else {
        console.warn(`No Value for event.target.id: ${event.target.id}`)
    }
}

/**
 * Update Options based on typeof
 * @function initOptions
 * @param {Object} options
 * @param {boolean} text
 */
export function updateOptions(options, text = false) {
    for (const [key, value] of Object.entries(options)) {
        // console.debug(`${key}: ${value}`)
        const el = document.getElementById(key)
        if (el) {
            if (text) {
                el.textContent = value.toString()
            } else if (typeof value === 'boolean') {
                el.checked = value
            } else {
                el.value = value
            }
            if (key === 'autoKickLowRate') {
                const kickLowRate = document.getElementById('kickLowRate')
                if (kickLowRate) {
                    kickLowRate.disabled = !value
                }
            }
        }
        // el.classList.remove('is-invalid')
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
    if (clone && container) {
        const element = clone.cloneNode(true)
        element.querySelector('.toast-body').innerHTML = message
        element.classList.add(`text-bg-${type}`)
        container.appendChild(element)
        const toast = new bootstrap.Toast(element)
        element.addEventListener('mousemove', () => toast.hide())
        toast.show()
    } else {
        console.info('Missing clone or container:', clone, container)
    }
}
