// JS Content Script

// ;(async () => {
//     // const { options } = await chrome.storage.sync.get(['options'])
//     // console.log('options:', options)
//     // const message = { message: 'test' }
//     // console.log('message:', message)
//     // const response = await chrome.runtime.sendMessage(message)
//     // console.log('response:', response)
// })()

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
        let profileID = url.searchParams.get('profile')
        console.debug(`profileID: ${profileID}`)
        const profileUrl = `https://api-v2.playdrift.com/api/profile/trpc/profile.get?input=%7B%22id%22%3A%22${profileID}%22%2C%22game%22%3A%22dominoes%22%7D`
        const response = await fetch(profileUrl)
        const data = await response.json()
        const profile = data.result.data
        console.info('profile:', profile)

        let div = document.createElement('div')
        let span = document.createElement('span')
        span.style.color =
            parseInt(profile.games_won) < parseInt(profile.games_lost) ||
            parseInt(profile.rating) < 150
                ? 'red'
                : 'green'
        span.id = 'stats-text'
        span.textContent = `Rating: ${profile.rating} - W/L: ${profile.games_won} / ${profile.games_lost}`
        div.appendChild(span)
        let root = document
            .querySelector('.MuiDialogContent-root')
            .querySelectorAll('.MuiBox-root')[3]
        root.appendChild(div)

        let sendButton = document.createElement('button')
        sendButton.addEventListener('click', sendClick)
        sendButton.textContent = 'Send and Close'
        sendButton.style.marginRight = '15px'
        sendButton.style.marginBottom = '10px'
        root.appendChild(sendButton)

        let copyButton = document.createElement('button')
        copyButton.addEventListener('click', copyClick)
        copyButton.textContent = 'Copy'
        root.appendChild(copyButton)

        // TODO: Add whole profile to form
        let username = document.createElement('span')
        username.id = 'profile-username'
        username.textContent = profile.username
        username.hidden = true
        root.appendChild(username)
    }
    // if (url.pathname.includes('/room/')) {
    //     let room = url.pathname.split('/')[2]
    //     console.debug(`Process Room: ${room}`)
    // }
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
