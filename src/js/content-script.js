// JS Content Script

;(async () => {
    console.info('RUNNING content-script.js')
    const { options, profile } = await chrome.storage.sync.get([
        'options',
        'profile',
    ])
    console.info('options, profile:', options, profile)

    // add mouseOver listener to document to trigger on specific elements
    if (options.sendMouseover) {
        document.addEventListener('mouseover', mouseOver)
    }

    // if profile object is empty, wait 3 seconds and check user profile
    if (profile && !Object.keys(profile).length) {
        setTimeout(setUserProfile, 3000)
    }

    setInterval(updateUserInterval, 2 * 60000)

    // // send message to service worker to enable action icon
    // const message = { action: true }
    // console.debug('message:', message)
    // const response = await chrome.runtime.sendMessage(message)
    // console.debug('response:', response)
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
    console.debug('onMessage: message:', message)
    if (typeof message.sendMouseover !== 'undefined') {
        console.log('message.sendMouseover', message.sendMouseover)
        // if (message.sendMouseover) {
        // }
        return
    } else if (!message.url) {
        return console.warn('No message.url')
    }
    const url = new URL(message.url)
    if (url.search.includes('?profile=')) {
        const profileID = url.searchParams.get('profile')
        console.debug(`profileID: ${profileID}`)
        const profile = await getProfile(profileID)
        updateProfile(profile)
        document
            .querySelector('.MuiDialog-container')
            .addEventListener('click', profileCloseClick)
    }
    if (url.pathname.includes('/room/')) {
        let room = url.pathname.split('/')[2]
        console.debug(`Process Room: ${room}`)
        // const picker = new Picker()
        // console.log('picker:', picker)
        // document.body.appendChild(picker)
    }
}

/**
 * document mouseover Callback
 * @function mouseOver
 * @param {MouseEvent} event
 */
async function mouseOver(event) {
    // console.log('mouseover:', event)
    if (
        event.target.tagName === 'IMG' &&
        event.target.parentNode?.dataset?.id
    ) {
        await sendChatMouseover(event.target.parentNode)
        // showMouseover(event.target.parentNode)
    }
}

/**
 * Send Chat Message Mouse Over Handler
 * @function sendChatMouseover
 * @param {HTMLElement} element
 */
async function sendChatMouseover(element) {
    const userID = element.dataset.id
    const parent =
        element.parentNode.parentNode.parentNode.parentNode.parentNode
    if (parent.dataset.testid !== 'app-layout-aside') {
        // console.debug('no dataset.testid')
        return
    }
    const sent = parent.querySelector(`#userid-${userID}`)
    if (sent) {
        // console.debug('already sent for user:', userID)
        return
    }
    const div = document.createElement('div')
    div.style.display = 'none'
    div.id = `userid-${userID}`
    parent.appendChild(div)

    const profile = await getProfile(userID)
    // console.debug('profile:', profile)
    // TODO: Make this a function, this is copy pasta
    const rating = parseInt(profile.rating)
    const games_won = parseInt(profile.games_won)
    const games_lost = parseInt(profile.games_lost)
    const wl_percent =
        parseInt((games_won / (games_won + games_lost)) * 100) || 0
    const statsText = `${profile.username} Rating: ${rating} - W/L: ${games_won.toLocaleString()} / ${games_lost.toLocaleString()} (${wl_percent}%)`
    // console.debug(statsText)
    sendChatMessage(statsText)
}

// /**
//  * Show Profile on Mouse Over Handler
//  * @function sendChatMouseover
//  * @param {HTMLElement} element
//  */
// function showMouseover(element) {
//     if (element.dataset.processed) {
//         return console.debug('already processed element:', element)
//     }
//     element.dataset.processed = 'yes'
//
//     const userID = element.dataset.id
//     console.info('userID', userID)
//     const div = document.createElement('div')
//     div.textContent = 'Test Test Test Test'
//     div.style.position = 'fixed'
//     div.style.color = 'red'
//     element.parentNode.appendChild(div)
// }

/**
 * Close Profile on Click Callback
 * @function profileCloseClick
 * @param {MouseEvent} event
 */
function profileCloseClick(event) {
    // console.debug('profileCloseClick', event)
    if (
        event.target.classList.contains('MuiDialog-container') &&
        event.target.classList.contains('MuiDialog-scrollPaper')
    ) {
        history.back()
    }
}

/**
 * Set User Profile Timeout - 3000
 * @function setUserProfile
 */
async function setUserProfile() {
    console.debug('setUserProfile')
    const userId = document.querySelector('div[data-id]')?.dataset.id
    if (!userId) {
        return console.warn('userId not found!', userId)
    }
    console.info('No profile, setting to userId:', userId)
    const userProfile = await getProfile(userId)
    await updateUserProfile(userProfile)
}

/**
 * Update User History Interval - 3 minutes
 * @function updateUserInterval
 */
async function updateUserInterval() {
    console.log('updateUserInterval')
    const { profile } = await chrome.storage.sync.get(['profile'])
    const userProfile = await getProfile(profile.id)
    await updateUserProfile(userProfile)
}

/**
 * Get Profile by User ID
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
    return profile
}

/**
 * Update User Profile
 * @function saveOptions
 * @param {Object} profile
 */
async function updateUserProfile(profile) {
    if (!profile) {
        return console.warn('updateUserProfile: No profile:', profile)
    }

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
    const root = document
        .querySelector('.MuiDialogContent-root')
        .querySelectorAll('.MuiBox-root')[3]
    root.style.marginTop = 0
    root.style.marginBottom = '10px'

    const divText = document.createElement('div')
    divText.style.textAlign = 'center'

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
    divText.appendChild(spanStats)

    const spanRating = document.createElement('span')
    spanRating.style.color = rating < 200 ? '#EE4B2B' : '#50C878'
    spanRating.textContent = ` Rating: ${rating} `
    divText.appendChild(spanRating)

    const spanGames = document.createElement('span')
    spanGames.style.color = wl_percent < 45 ? '#EE4B2B' : '#50C878'
    spanGames.id = 'stats-text'
    spanGames.textContent = ` W/L: ${games_won.toLocaleString()} / ${games_lost.toLocaleString()} (${wl_percent}%) `
    divText.appendChild(spanGames)

    root.appendChild(divText)
    const divBtns = document.createElement('div')
    divBtns.style.textAlign = 'center'

    const button = document.createElement('button')
    button.style.margin = '0 2px 0 2px'

    const copyButton = button.cloneNode(true)
    copyButton.addEventListener('click', copyClick)
    copyButton.textContent = 'Copy'
    copyButton.style.marginRight = '15px'
    divBtns.appendChild(copyButton)

    const kickButton = button.cloneNode(true)
    kickButton.addEventListener('click', kickClick)
    kickButton.textContent = 'Kick'
    divBtns.appendChild(kickButton)

    const sendKickButton = button.cloneNode(true)
    sendKickButton.addEventListener('click', sendKickClick)
    sendKickButton.textContent = 'Send/Kick'
    divBtns.appendChild(sendKickButton)

    const sendButton = button.cloneNode(true)
    sendButton.addEventListener('click', sendClick)
    sendButton.textContent = 'Send'
    sendButton.style.marginLeft = '15px'
    divBtns.appendChild(sendButton)

    root.appendChild(divBtns)

    // TODO: Add whole profile to form
    const profileForm = document.createElement('form')
    profileForm.classList.add('visually-hidden')
    const profileInput = document.createElement('input')
    profileInput.hidden = true
    const keys = ['id', 'username']
    for (const key of keys) {
        const input = profileInput.cloneNode(true)
        input.id = `profile-${key}`
        input.value = profile[key]
        profileForm.appendChild(input)
    }
    root.appendChild(profileForm)
}

/**
 * Copy Stats Click Callback
 * @function saveOptions
 * @param {MouseEvent} event
 */
function copyClick(event) {
    console.debug('copyClick', event)
    const username = document.getElementById('profile-username').value
    const text = document.getElementById('stats-text').textContent
    const data = `${username} - ${text}`
    console.log(`Copied: ${data}`)
    navigator.clipboard.writeText(data).then()
    // history.back()
}

/**
 * Send Chat Click Callback
 * @function saveOptions
 * @param {MouseEvent} event
 */
function sendClick(event) {
    console.debug('sendClick: event:', event)
    const username = document.getElementById('profile-username').value
    // const playerID = document.getElementById('profile-id').value
    const text = document.getElementById('stats-text').textContent
    const data = `${username} - ${text}`
    console.log(`Sending: ${data}`)
    sendChatMessage(data)
    history.back()
}

/**
 * Send Chat and Kick Click Callback
 * @function sendKickClick
 * @param {MouseEvent} event
 */
async function sendKickClick(event) {
    const playerID = document.getElementById('profile-id').value
    console.debug('sendKickClick: playerID, event:', playerID, event)
    await kickPlayer(playerID)
    sendClick(event)
}

/**
 * Kick Click Callback
 * @function kickClick
 * @param {MouseEvent} event
 */
async function kickClick(event) {
    const playerID = document.getElementById('profile-id').value
    console.debug('kickClick: playerID, event:', playerID, event)
    await kickPlayer(playerID)
    history.back()
}

/**
 * Kick a Player by ID
 * @function kickPlayer
 * @param {string} playerID
 */
async function kickPlayer(playerID) {
    const room = location.pathname.split('/')[2]
    const url = `https://api-v2.playdrift.com/api/v1/room/dominoes%23v3/${room}/action/kick`
    console.log('url:', url)
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ player: playerID }),
    })
    const data = await response.json()
    console.log('data:', data)
}

/**
 * Send a Chat Message
 * @function sendChatMessage
 * @param {string} message
 */
function sendChatMessage(message) {
    console.log(`sendChatMessage: ${message}`)
    const textarea = document.querySelectorAll('textarea[aria-invalid="false"]')
    if (textarea.length) {
        if (textarea.length > 1) {
            textarea[1].value = message
        } else {
            textarea[0].value = message
        }
        document.querySelector('button[aria-label="send message"]')?.click()
    }
}

// function addBtn() {
//     const button = document.createElement('button')
//     button.textContent = 'Emoji'
//     button.addEventListener('click', emojiBtnClick)
//     const msgBox = document.querySelector('div[aria-label="message"]')
//     msgBox.parentElement.parentElement.appendChild(button)
// }
// function emojiBtnClick(event) {
//     console.debug('emojiBtnClick:', event)
// }

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

// const userId = document.querySelector('div[data-id]').dataset.id
// console.debug('update user profile:', userId)
// await updateUserProfile(userId)
// console.log(1)
// const src = chrome.runtime.getURL('dist/emoji-picker-element/picker.js')
// console.log('src:', src)
// import(src).then((module) => {
//     // Do something with the module.
//     console.log('module:', module)
//     console.log(2)
//     const picker = new Picker()
//     console.log('picker:', picker)
//     document.body.appendChild(picker)
//     console.log(3)
// })
// const contentMain = await import(src)
// console.log('contentMain:', contentMain)
// console.log(2)
// contentMain.main()
// const picker = new contentMain.Picker()
// const picker = new Picker()
// console.log(4)
// console.log('picker:', picker)
// document.body.appendChild(picker)
// console.log(5)
