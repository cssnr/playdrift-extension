// JS Content Script

;(async () => {
    console.info('RUNNING content-script.js')
    const { options } = await chrome.storage.sync.get(['options'])
    console.debug('options:', options)
    const message = { action: true }
    console.debug('message:', message)
    const response = await chrome.runtime.sendMessage(message)
    console.debug('response:', response)
})()

chrome.runtime.onMessage.addListener(onMessage)

/**
 * On Message Callback
 * @function onMessage
 * @param {Object} message
 * @param {MessageSender} sender
 * @param {Function} sendResponse
 */
async function onMessage(message, sender, sendResponse) {
    console.log('onMessage: message:', message)
    if (!message.url) {
        return console.warn('No message.url')
    }
    let url = new URL(message.url)
    if (url.search.includes('?profile=')) {
        const profileID = url.searchParams.get('profile')
        console.debug(`profileID: ${profileID}`)
        const profile = await getProfile(profileID)
        console.debug('profile:', profile)
        updateProfile(profile)
    }
    // if (url.pathname.includes('/room/')) {
    //     let room = url.pathname.split('/')[2]
    //     console.debug(`Process Room: ${room}`)
    // }
}

/**
 * copyClick Callback
 * @function saveOptions
 * @param {string} profileID
 * @returns {Object}
 */
async function getProfile(profileID) {
    const profileUrl = `https://api-v2.playdrift.com/api/profile/trpc/profile.get?input=%7B%22id%22%3A%22${profileID}%22%2C%22game%22%3A%22dominoes%22%7D`
    const response = await fetch(profileUrl)
    const data = await response.json()
    const profile = data.result.data
    console.info('profile:', profile)
    return profile
}

/**
 * copyClick Callback
 * @function saveOptions
 * @param {Object} profile
 */
function updateProfile(profile) {
    let div = document.createElement('div')
    div.style.marginBottom = '10px'

    const rating = parseInt(profile.rating)
    const games_won = parseInt(profile.games_won)
    const games_lost = parseInt(profile.games_lost)
    const statsText = `Rating: ${rating} - W/L: ${games_won.toLocaleString()} / ${games_lost.toLocaleString()}`
    console.log(statsText)

    let spanStats = document.createElement('span')
    spanStats.id = 'stats-text'
    spanStats.textContent = statsText
    spanStats.hidden = true
    div.appendChild(spanStats)

    let copyButton = document.createElement('button')
    copyButton.addEventListener('click', copyClick)
    copyButton.textContent = 'Copy'
    copyButton.style.marginRight = '5px'
    div.appendChild(copyButton)

    let spanRating = document.createElement('span')
    spanRating.style.color = rating < 200 ? '#EE4B2B' : '#50C878'
    spanRating.textContent = ` Rating: ${rating} `
    div.appendChild(spanRating)

    let spanGames = document.createElement('span')
    spanGames.style.color = games_won < games_lost ? '#EE4B2B' : '#50C878'
    spanGames.id = 'stats-text'
    spanGames.textContent = ` W/L: ${games_won.toLocaleString()} / ${games_lost.toLocaleString()} `
    div.appendChild(spanGames)

    let sendButton = document.createElement('button')
    sendButton.addEventListener('click', sendClick)
    sendButton.textContent = 'Send/Close'
    sendButton.style.marginLeft = '5px'
    div.appendChild(sendButton)

    // TODO: Add whole profile to form
    let spanUsername = document.createElement('span')
    spanUsername.id = 'profile-username'
    spanUsername.textContent = profile.username
    spanUsername.hidden = true
    div.appendChild(spanUsername)

    let root = document
        .querySelector('.MuiDialogContent-root')
        .querySelectorAll('.MuiBox-root')[3]
    root.appendChild(div)
}

/**
 * copyClick Callback
 * @function saveOptions
 * @param {MouseEvent} event
 */
function copyClick(event) {
    console.debug('copyClick', event)
    let username = document.getElementById('profile-username').textContent
    let text = document.getElementById('stats-text').textContent
    let data = `${username} - ${text}`
    console.log(`copied text: ${data}`)
    navigator.clipboard.writeText(data).then()
    // history.back()
}

/**
 * sendClick Callback
 * @function saveOptions
 * @param {MouseEvent} event
 */
function sendClick(event) {
    console.debug('sendClick', event)
    let username = document.getElementById('profile-username').textContent
    let text = document.getElementById('stats-text').textContent
    let data = `${username} - ${text}`
    console.log(`sending text: ${data}`)
    let textarea = document.querySelectorAll('textarea[aria-invalid="false"]')
    if (textarea.length) {
        if (textarea.length > 1) {
            textarea[1].value = data
        } else {
            textarea[0].value = data
        }
        document.querySelector('button[aria-label="send message"]')?.click()
    }
    history.back()
}
