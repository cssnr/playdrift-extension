// JS Content Script

;(async () => {
    console.info('RUNNING content-script.js')
    const { options, profile } = await chrome.storage.sync.get([
        'options',
        'profile',
    ])
    console.debug('options, profile:', options, profile)

    // add mouseOver listener to document to trigger on specific elements
    if (options.showMouseover) {
        document.addEventListener('mouseover', showMouseover)
    }
    if (options.sendMouseover) {
        document.addEventListener('mouseover', sendChatMouseover)
    }

    // if profile object is empty, wait 3 seconds and check user profile
    if (profile && !Object.keys(profile).length) {
        setTimeout(setUserProfile, 3000)
    }

    // check user profile every 2 minutes to check for new games
    setInterval(updateUserInterval, 2 * 60000)

    // const tooltip = document.createElement('div')
    // tooltip.id = 'tooltip'
    // tooltip.setAttribute('role', 'tooltip')
    // tooltip.textContent = 'I am a fucking tooltip.'
    // tooltip.style.color = '#FFF'
    // tooltip.style.backgroundColor = '#333'
    // tooltip.style.borderRadius = '4px'
    // tooltip.style.fontSize = '13px'
    // document.body.appendChild(tooltip)

    // // send message to service worker to enable action icon
    // const message = { action: true }
    // console.debug('message:', message)
    // const response = await chrome.runtime.sendMessage(message)
    // console.debug('response:', response)
})()

chrome.runtime.onMessage.addListener(onMessage)

const profiles = {}

// const pickerOptions = { onEmojiSelect: onEmojiSelect }
// const picker = new EmojiMart.Picker(pickerOptions)
// document.body.appendChild(picker)
// function onEmojiSelect(emojiData, event) {
//     console.debug('onEmojiSelect:', emojiData, event)
// }

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
        // console.log('message.sendMouseover', message.sendMouseover)
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
        const room = url.pathname.split('/')[2]
        console.debug(`Process Room: ${room}`)
        const { options } = await chrome.storage.sync.get(['options'])
        if (options.sendMouseover) {
            const root = document.querySelector('aside').childNodes[0]
            if (!root.querySelector('#sendMouseover-notification')) {
                console.debug('Adding Send Mouse Over ON Notification')
                const div = document.createElement('div')
                div.id = 'sendMouseover-notification'
                div.textContent = 'Mouse Over ON'
                div.style.textAlign = 'center'
                div.style.color = '#50C878'
                div.style.float = 'right'
                root.prepend(div)
            }
        }
        // const picker = new Picker()
        // console.log('picker:', picker)
        // document.body.appendChild(picker)

        if (options.sendOnJoin) {
            const aside = document.querySelector('aside')
            if (aside) {
                // console.info('addEventListener DOMNodeInserted', aside)
                // aside.addEventListener('DOMNodeInserted', newChatMessage)
                setTimeout(function () {
                    aside.addEventListener('DOMNodeInserted', newChatMessage)
                }, 2000)
            }
        }

        // console.log(`connecting sse room: ${room}`)
        // // const url = `https://api-v2.playdrift.com/api/v1/room/dominoes%23v3/${room}/sse`
        // const url = `https://api-v2.playdrift.com/api/v1/room/dominoes%23v3/${room}/ssejoin`
        // const evtSource = new EventSource(url, {
        //     withCredentials: true,
        // })
        // evtSource.onmessage = (event) => {
        //     console.log(`evtSource.onmessage: ${event.data}`, event)
        // }
    }
}

// function generateGetBoundingClientRect(x = 0, y = 0) {
//     return () => ({
//         width: 0,
//         height: 0,
//         top: y,
//         right: x,
//         bottom: y,
//         left: x,
//     })
// }
// const virtualElement = {
//     getBoundingClientRect: generateGetBoundingClientRect(),
// }
// // const tooltip = document.getElementById('tooltip')
// const tooltip = document.createElement('div')
// tooltip.id = 'tooltip'
// tooltip.setAttribute('role', 'tooltip')
// tooltip.textContent = 'I am a fucking tooltip.'
// tooltip.style.color = '#FFF'
// tooltip.style.backgroundColor = '#333'
// tooltip.style.borderRadius = '4px'
// tooltip.style.fontSize = '13px'
// tooltip.style.display = 'none'
// document.body.appendChild(tooltip)
// const instance = Popper.createPopper(virtualElement, tooltip)
// document.addEventListener('mousemove', ({ clientX: x, clientY: y }) => {
//     virtualElement.getBoundingClientRect = generateGetBoundingClientRect(x, y)
//     instance.update()
// })

async function newChatMessage(event) {
    console.log(`newChatMessage: ${event.target.textContent}`)
    if (event.target.textContent.startsWith('Joined the game.')) {
        console.log('Matched Message - Sending Stats')
        const userID = event.target.dataset.cid

        // TODO: This was duplicated - bad
        const sent = event.relatedNode.querySelector(`#userid-${userID}`)
        if (sent) {
            console.debug('already sent for user:', userID)
            return
        }
        const div = document.createElement('div')
        div.style.display = 'none'
        div.id = `userid-${userID}`
        event.relatedNode.appendChild(div)

        const profile = await getProfile(userID)
        const stats = calStats(profile)
        // console.debug(statsText)
        sendChatMessage(stats.text)
    }
}

/**
 * Send Chat Message Mouse Over Handler
 * @function sendChatMouseover
 * @param {MouseEvent} event
 */
async function sendChatMouseover(event) {
    if (
        event.target.tagName !== 'IMG' ||
        !event.target.parentNode?.dataset?.id
    ) {
        return
    }

    const userID = event.target.parentNode.dataset.id
    console.debug('sendChatMouseover:', userID)
    const parent =
        event.target.parentNode.parentNode.parentNode.parentNode.parentNode
            .parentNode
    if (parent.dataset.testid !== 'app-layout-aside') {
        // console.debug('no dataset.testid')
        return
    }

    // TODO: This is being duplicated - bad
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
    const stats = calStats(profile)
    // console.debug(statsText)
    sendChatMessage(stats.text)
}

/**
 * Show Profile on Mouse Over Handler
 * @function sendChatMouseover
 * @param {MouseEvent} event
 */
async function showMouseover(event) {
    if (
        event.target.tagName !== 'IMG' ||
        !event.target.parentNode?.dataset?.id
    ) {
        return
    }

    // console.log('hide tooltip')
    // tooltip.style.display = 'block'

    const element = event.target.parentNode
    console.debug('showMouseover:', element)
    if (element.dataset.processed) {
        // console.debug('already processed element:', element)
        return
    }
    element.dataset.processed = 'yes'
    console.log('element.parentNode', element.parentNode)
    element.parentNode.style.position = 'relative'

    // const tooltip = document.getElementById('tooltip')
    // Popper.createPopper(element, tooltip, {
    //     placement: 'right',
    // })

    const userID = element.dataset.id
    console.log('userID', userID)
    const profile = await getProfile(userID)
    const stats = calStats(profile)
    const div = document.createElement('div')
    div.style.position = 'absolute'
    div.style.marginTop = '-3px'
    // div.style.paddingLeft = '3px'
    div.style.textAlign = 'center'
    div.style.width = '40px'
    div.style.fontSize = '15px'
    div.style.pointerEvents = 'none'

    const spanRating = document.createElement('span')
    spanRating.textContent = profile.rating
    spanRating.style.width = '100%'
    // spanRating.style.margin = '-5px 0'
    spanRating.style.display = 'inline-block'
    // spanRating.style.position = 'fixed'

    if (profile.rating < 200) {
        spanRating.style.color = '#EE4B2B'
    } else {
        spanRating.style.color = '#50C878'
    }
    spanRating.style.textShadow =
        '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
    div.appendChild(spanRating)

    // const br = document.createElement('br')
    // br.style.margin = '-5px 0'
    // div.appendChild(br)

    const spanRate = document.createElement('span')
    spanRate.textContent = `${stats.wl_percent}%`
    spanRating.style.width = '100%'
    // spanRate.style.margin = '-5px 0'
    spanRate.style.display = 'inline-block'
    // spanRate.style.position = 'fixed'

    if (stats.wl_percent < 45) {
        spanRate.style.color = '#EE4B2B'
    } else {
        spanRate.style.color = '#50C878'
    }
    spanRate.style.textShadow =
        '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
    div.appendChild(spanRate)

    element.parentNode.appendChild(div)
}

/**
 * Calculate Stats from profile
 * @function calStats
 * @param {Object} profile
 * @return {Object}
 */
function calStats(profile) {
    const rating = parseInt(profile.rating)
    const games_won = parseInt(profile.games_won)
    const games_lost = parseInt(profile.games_lost)
    const wl_percent =
        parseInt((games_won / (games_won + games_lost)) * 100) || 0
    const text = `${profile.username} Rating: ${rating} - W/L: ${games_won.toLocaleString()} / ${games_lost.toLocaleString()} (${wl_percent}%)`
    return { rating, games_won, games_lost, wl_percent, text }
}

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
    console.info('User Profile Set to userId:', userId)
    const userProfile = await getProfile(userId)
    await updateUserProfile(userProfile)
}

/**
 * Update User History Interval - 3 minutes
 * @function updateUserInterval
 */
async function updateUserInterval() {
    console.debug('updateUserInterval')
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
    if (profiles[profileID]) {
        const age =
            Math.floor(Date.now() / 1000) - profiles[profileID].ts_updated
        if (age < 60) {
            console.debug('using cached profile, age:', age)
            return profiles[profileID]
        }
        console.debug('cached profile expired, age:', age)
    }
    const profileUrl = `https://api-v2.playdrift.com/api/profile/trpc/profile.get?input=%7B%22id%22%3A%22${profileID}%22%2C%22game%22%3A%22dominoes%22%7D`
    console.debug('profileUrl:', profileUrl)
    const response = await fetch(profileUrl)
    const data = await response.json()
    const profile = data.result.data
    profile.ts_updated = Math.floor(Date.now() / 1000)
    profiles[profileID] = profile
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

    console.log('Updating User Profile:', profile)
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
    console.debug('kickPlayer: playerID:', playerID)
    const room = location.pathname.split('/')[2]
    const url = `https://api-v2.playdrift.com/api/v1/room/dominoes%23v3/${room}/action/kick`
    // console.debug('url:', url)
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
    console.debug('data:', data)
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
