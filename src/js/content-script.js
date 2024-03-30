// JS Content Script

;(async () => {
    console.info('RUNNING content-script.js')

    // const { options } = await chrome.storage.sync.get(['options'])
    // console.debug('options:', options)
    // const message = { action: true }
    // console.debug('message:', message)
    // const response = await chrome.runtime.sendMessage(message)
    // console.debug('response:', response)

    // const userId = document.querySelector('div[data-id]').dataset.id
    // console.debug('update user profile:', userId)
    // await updateUserProfile(userId)
})()

// const observer = new MutationObserver(mutationCallback)
// observer.observe(document.body, {
//     attributes: true,
//     childList: true,
//     subTree: true,
// })
//
// function mutationCallback(mutationList, observer) {
//     console.info('mutationCallback, mutationList:', mutationList, observer)
//     for (const mutation of mutationList) {
//         if (mutation.type === 'childList') {
//             console.info('A child node has been added or removed.')
//         } else if (mutation.type === 'attributes') {
//             console.info(
//                 `The ${mutation.attributeName} attribute was modified.`
//             )
//         }
//     }
// }

chrome.runtime.onMessage.addListener(onMessage)

setInterval(updateUserInterval, 2 * 60000)

async function updateUserInterval() {
    console.log('updateUserInterval')
    // TODO: This does not work, get user from storage
    const userId = document.querySelector('div[data-id]').dataset.id
    if (!userId) {
        return console.warn('userId not found!')
    }
    await getProfile(userId)
    // const profile = await getProfile(userId)
    // updateUserProfile(profile)
}

/**
 * On Message Callback
 * @function onMessage
 * @param {Object} message
 * @param {MessageSender} sender
 * @param {Function} sendResponse
 */
async function onMessage(message, sender, sendResponse) {
    console.debug('onMessage: message:', message)
    // if (message.userProfile) {
    //     const profile = await getProfile(message.userProfile)
    //     updateProfile(profile)
    //     return console.log('updated user profile via alarm message')
    // }
    if (!message.url) {
        return console.warn('No message.url')
    }
    const url = new URL(message.url)
    if (url.search.includes('?profile=')) {
        const profileID = url.searchParams.get('profile')
        console.debug(`profileID: ${profileID}`)
        const profile = await getProfile(profileID)
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
    console.debug('profileUrl:', profileUrl)
    const response = await fetch(profileUrl)
    const data = await response.json()
    const profile = data.result.data
    console.info('profile:', profile)

    // TODO: This does not work, get user from storage
    const userId = document.querySelector('div[data-id]').dataset.id
    if (userId === profileID) {
        await updateUserProfile(profile)
    }
    return profile
}

/**
 * Update User Profile
 * @function saveOptions
 * @param {Object} profile
 */
async function updateUserProfile(profile) {
    // const profile = await getProfile(userId)
    // console.debug('profile:', profile)
    console.info('Updating User Profile:', profile)
    await chrome.storage.sync.set({ profile })

    const { history } = await chrome.storage.sync.get(['history'])
    console.debug('history:', history)
    const last = history.slice(-1)[0]
    console.debug('last:', last)
    const current = {
        rating: profile.rating,
        games_won: profile.games_won,
        games_lost: profile.games_lost,
        ts_last: profile.ts_last,
        win: false,
    }
    if (
        !last ||
        last.games_won + last.games_lost !==
            current.games_won + current.games_lost
    ) {
        if (last && current.games_won > last.games_won) {
            current.win = true
        }
        console.info('Adding current to history:', current)
        history.push(current)
        await chrome.storage.sync.set({ history })
    }
}

/**
 * copyClick Callback
 * @function saveOptions
 * @param {Object} profile
 */
function updateProfile(profile) {
    const div = document.createElement('div')
    div.style.marginBottom = '10px'

    const rating = parseInt(profile.rating)
    const games_won = parseInt(profile.games_won)
    const games_lost = parseInt(profile.games_lost)
    const wl_percent =
        parseInt((games_won / (games_won + games_lost)) * 100) || 0
    const statsText = `Rating: ${rating} - W/L: ${games_won.toLocaleString()} / ${games_lost.toLocaleString()} (${wl_percent}%)`
    // console.debug(statsText)

    const spanStats = document.createElement('span')
    spanStats.id = 'stats-text'
    spanStats.textContent = statsText
    spanStats.hidden = true
    div.appendChild(spanStats)

    const copyButton = document.createElement('button')
    copyButton.addEventListener('click', copyClick)
    copyButton.textContent = 'Copy'
    copyButton.style.marginRight = '5px'
    div.appendChild(copyButton)

    const spanRating = document.createElement('span')
    spanRating.style.color = rating < 200 ? '#EE4B2B' : '#50C878'
    spanRating.textContent = ` Rating: ${rating} `
    div.appendChild(spanRating)

    const spanGames = document.createElement('span')
    spanGames.style.color = games_won < games_lost ? '#EE4B2B' : '#50C878'
    spanGames.id = 'stats-text'
    spanGames.textContent = ` W/L: ${games_won.toLocaleString()} / ${games_lost.toLocaleString()} (${wl_percent}%) `
    div.appendChild(spanGames)

    const sendButton = document.createElement('button')
    sendButton.addEventListener('click', sendClick)
    sendButton.textContent = 'Send'
    sendButton.style.marginLeft = '5px'
    div.appendChild(sendButton)

    // TODO: Add whole profile to form
    const spanUsername = document.createElement('span')
    spanUsername.id = 'profile-username'
    spanUsername.textContent = profile.username
    spanUsername.hidden = true
    div.appendChild(spanUsername)

    const root = document
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
    const username = document.getElementById('profile-username').textContent
    const text = document.getElementById('stats-text').textContent
    const data = `${username} - ${text}`
    console.log(`Copied: ${data}`)
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
    const username = document.getElementById('profile-username').textContent
    const text = document.getElementById('stats-text').textContent
    const data = `${username} - ${text}`
    console.log(`Sending: ${data}`)
    const textarea = document.querySelectorAll('textarea[aria-invalid="false"]')
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
