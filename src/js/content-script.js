// JS Content Script

chrome.runtime.onMessage.addListener(onMessage)

document.addEventListener('mouseover', documentMouseover)

setInterval(updateUserInterval, 2 * 60000)

let source1
let source2
let source3

const profiles = {}
const rooms = {}
let currentRoom = ''

const joinAudio = new Audio(chrome.runtime.getURL('/audio/join.mp3'))
const leaveAudio = new Audio(chrome.runtime.getURL('/audio/leave.mp3'))
const turnAudio = new Audio(chrome.runtime.getURL('/audio/turn.mp3'))

// Popper Tooltip
const tooltip = document.createElement('div')
tooltip.id = 'tooltip'
tooltip.setAttribute('role', 'tooltip')
tooltip.innerHTML = 'Loading...'
document.body.appendChild(tooltip)

// async
;(async () => {
    console.info('RUNNING content-script.js')
    const { options, profile } = await chrome.storage.sync.get([
        'options',
        'profile',
    ])
    console.debug('options, profile:', options, profile)

    // if profile object is empty, wait 3 seconds and check user profile
    if (profile && !Object.keys(profile).length) {
        setTimeout(setUserProfile, 3000)
    }
})()

// Popper Mouse Listener
const virtualElement = {
    getBoundingClientRect: generateGetBoundingClientRect(),
}
const instance = Popper.createPopper(virtualElement, tooltip)
document.addEventListener('mousemove', ({ clientX: x, clientY: y }) => {
    virtualElement.getBoundingClientRect = generateGetBoundingClientRect(x, y)
    instance.update()
})
function generateGetBoundingClientRect(x = 0, y = 0) {
    return () => ({
        width: 200,
        height: 0,
        top: y - 10,
        right: x,
        bottom: y,
        left: x + 20,
    })
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
    if (!message.url) {
        return console.warn('No message.url')
    }
    const url = new URL(message.url)
    if (url.searchParams.get('profile')) {
        const profileID = url.searchParams.get('profile')
        const profile = await getProfile(profileID)
        const { banned } = await chrome.storage.sync.get(['banned'])
        setTimeout(updateProfile, 150, profile, banned)
    } else if (url.pathname.includes('/room/')) {
        const split = url.pathname.split('/')
        const room = split[2]
        const game = split[3]
        currentRoom = room
        // console.debug('SET currentRoom:', currentRoom)
        if (room) {
            setTimeout(processRoom, 250, room)
        }
        if (game) {
            await processGame(game)
        }
    } else {
        // TODO: This can be done at the sse function level
        if (source1 && source1.readyState === 1) {
            source1.close()
            console.debug('close sse1 source1', source1)
        }
        if (source2 && source2.readyState === 1) {
            source2.close()
            console.debug('close sse2 source2', source2)
        }
        if (source3 && source3.readyState === 1) {
            source3.close()
            console.debug('close sse2 source3', source3)
        }
    }
}

/**
 * Process Room Handler
 * TODO: Refactor this function to check source1 connection
 * @function processRoom
 * @param {String} room
 */
async function processRoom(room) {
    const aside = document.querySelector('aside')
    console.debug('aside:', aside)
    if (!aside) {
        return console.warn('Error Processing Room, No ASIDE:', room)
    }
    const processed = aside.querySelector(`#processed-${room}`)
    if (processed) {
        return console.debug('Already Processed Room:', room)
    }
    const div = document.createElement('div')
    div.id = `processed-${room}`
    aside.appendChild(div)

    console.debug(`Process Room: ${room}`)
    await sse1(room)
}

/**
 * Process Game Handler
 * TODO: Refactor this function to check source3 connection
 * @function processGame
 * @param {String} game
 */
async function processGame(game) {
    const aside = document.querySelector('aside')
    console.debug('aside:', aside)
    if (!aside) {
        return console.warn('Error Processing Game, No ASIDE:', game)
    }
    const processed = aside.querySelector(`#processed-${game}`)
    if (processed) {
        return console.debug('Already Processed Game:', game)
    }
    const div = document.createElement('div')
    div.id = `processed-${game}`
    aside.appendChild(div)

    console.debug(`Process Game: ${game}`)
    await sse3(game)
}

/**
 * Server-Sent Event Room Handler
 * @function sse1
 * @param {String} room
 */
async function sse1(room) {
    const url = `https://api-v2.playdrift.com/api/v1/room/dominoes%23v3/${room}/sse`
    // const url = `https://api-v2.playdrift.com/api/v1/chat/messages/h3KnXwaJqEmA8o9rNAENq/sse`
    console.debug('connecting to sse1 url:', url)
    source1 = new EventSource(url, {
        withCredentials: true,
    })
    // console.debug('source1:', source1)
    const { options, profile } = await chrome.storage.sync.get([
        'options',
        'profile',
    ])
    source1.addEventListener('msg', function (event) {
        const msg = JSON.parse(event.data)
        // console.debug('msg:', msg)
        if (msg.t === 'rs' && msg.state.tid) {
            console.debug('Room State:', msg.state)
            // console.log(`Set Room: "${room}" room.tid = ${msg.state.tid}`)
            if (
                rooms[room] &&
                rooms[room].players.length !== msg.state.players.length
            ) {
                roomPlayerChange(rooms[room].players, msg.state.players)
            }
            rooms[room] = msg.state
            // source.close()
            // setTimeout(sse2, 150, msg.state.tid)
        }
        if (msg.t === 'helo') {
            setTimeout(sse2, 2000, room)
            if (options.sendSelfOnJoin) {
                sendPlayerStats(profile.id).then()
            }
        }
    })
}

/**
 * Server-Sent Event Chat Handler
 * @function sse2
 * @param {String} room
 */
async function sse2(room) {
    if (!rooms[room]?.tid) {
        return console.warn('room not found in rooms:', room, rooms)
    }
    const url = `https://api-v2.playdrift.com/api/v1/chat/messages/${rooms[room].tid}/sse`
    console.debug('connecting to sse2 url:', url)
    source2 = new EventSource(url, {
        withCredentials: true,
    })
    // console.debug('source2:', source2)
    const now = Date.now()
    source2.addEventListener('msg', function (event) {
        const msg = JSON.parse(event.data)
        if (msg.t === 'm' && msg.json?.ts > now) {
            newChatMessage(msg).then()
        }
    })
}

/**
 * Server-Sent Event Game Handler
 * TODO: Options Handling Needs Overhaul vs Always Calling Get
 * TODO: Add Option to Set Audio Tone after Options Overhaul
 * @function sse3
 * @param {String} game
 */
async function sse3(game) {
    if (!game) {
        return console.warn('game not provided:', game)
    }
    const rand = (Math.random() + 1).toString(36).substring(2)
    const url = `https://api-v2.playdrift.com/api/v1/game/${game}/sse?sseid=${rand}`
    console.debug('connecting to sse3 url:', url)
    source3 = new EventSource(url, {
        withCredentials: true,
    })
    // console.debug('source3:', source3)
    // const { options, profile } = await chrome.storage.sync.get([
    //     'options',
    //     'profile',
    // ])
    const { profile } = await chrome.storage.sync.get(['profile'])
    source3.addEventListener('msg', async (event) => {
        const msg = JSON.parse(event.data)
        // console.debug('msg:', msg)
        if (msg.t === 'a') {
            if (msg.a.t === 'player') {
                if (msg.a.pid === profile.id) {
                    const { options } = await chrome.storage.sync.get([
                        'options',
                    ])
                    if (options.playTurnAudio) {
                        await turnAudio.play()
                    }
                }
            }
        }
    })
}

/**
 * Room Player Update Handler
 * @function roomPlayerChange
 * @param {Array} before
 * @param {Array} after
 */
function roomPlayerChange(before, after) {
    console.debug('roomPlayerChange:', before, after)
    const left = []
    const joined = []
    for (const player of before) {
        if (!after.includes(player)) {
            left.push(player)
        }
    }
    playersLeaveRoom(left)
    for (const player of after) {
        if (!before.includes(player)) {
            joined.push(player)
        }
    }
    playersJoinRoom(joined)
}

/**
 * Players Leave Room Handler
 * @function playersLeaveRoom
 * @param {Array} players
 */
function playersLeaveRoom(players) {
    if (!players.length) {
        return
    }
    console.debug('playersLeaveRoom:', players)
    // const { options } = await chrome.storage.sync.get(['options'])
    chrome.storage.sync.get(['options']).then((result) => {
        // console.log('result:', result)
        if (result.options.playPlayersAudio) {
            leaveAudio.play().then()
        }
    })
}

/**
 * Players Join Room Handler
 * @function playersJoinRoom
 * @param {Array} players
 */
function playersJoinRoom(players) {
    if (!players.length) {
        return
    }
    console.debug('playersJoinRoom:', players)
    chrome.storage.sync.get(['options']).then((result) => {
        // console.log('result:', result)
        if (result.options.playPlayersAudio) {
            joinAudio.play().then()
        }
    })
}

/**
 * New Chat Message Handler
 * @function newChatMessage
 * @param {Object} msg
 */
async function newChatMessage(msg) {
    // console.debug('newChatMessage:', msg)
    if (!msg.json) {
        return console.debug('NO msg.json')
    }
    const message = msg.json.message
    const playerID = msg.json.cid

    const { banned, options, profile } = await chrome.storage.sync.get([
        'banned',
        'options',
        'profile',
    ])
    // console.debug('banned, options, profile:', banned, options, profile)

    const room = rooms[currentRoom]
    const owner = room?.players.length && room.players[0] === profile.id
    // console.debug('owner, room:', owner, room)

    if (message.startsWith('Joined the game.')) {
        console.debug('Process Join Message')
        if (profile.id === playerID) {
            // console.debug('ignoring self user join events')
            return
        }
        if (room?.kicked.includes(playerID)) {
            // console.debug('return on kicked user:', playerID)
            return
        }
        const player = await getProfile(playerID)
        const stats = await calStats(player)
        if (owner) {
            if (banned.includes(playerID)) {
                await kickPlayer(playerID)
                await sendChatMessage(
                    `Auto Kicked Banned User: ${player.username}`
                )
                // console.debug('return and kicked banned:', playerID)
                return
            }
            if (
                options.autoKickLowRate &&
                stats.wl_percent < options.kickLowRate
            ) {
                await kickPlayer(playerID)
                await sendChatMessage(
                    `Auto Kicked Low Win Rate Player: ${player.username} (${stats.wl_percent}%)`
                )
                return
            }
        }
        if (options.sendOnJoin) {
            return await sendStatsChat(playerID)
        }
    }
    if (
        message.startsWith('!stat') ||
        message.startsWith('!rating') ||
        message.startsWith('!record')
    ) {
        await sendPlayerStats(playerID)
    } else if (
        message.startsWith('!help') ||
        message.startsWith('!info') ||
        message.startsWith('!addon')
    ) {
        const msg1 = `Stats and Rating are hidden in your profile. I wrote an addon to display stats, store game history, auto kick low win rate players, ban users, and much more. More Info on GitHub: https://github.com/smashedr/playdrift-extension`
        await sendChatMessage(msg1)
    }
}

/**
 * Document Mouse Over Handler
 * @function documentMouseover
 * @param {MouseEvent} event
 */
async function documentMouseover(event) {
    if (
        event.target.tagName !== 'IMG' ||
        !event.target.parentNode?.dataset?.id
    ) {
        if (tooltip.style.display !== 'none') {
            // console.debug('hide tooltip')
            tooltip.style.display = 'none'
            tooltip.innerHTML = 'Loading...'
        }
        return
    }
    const { options } = await chrome.storage.sync.get(['options'])

    // Cache the profile
    if (
        options.showMouseover ||
        // options.sendMouseover ||
        options.showTooltipMouseover
    ) {
        await getProfile(event.target.parentNode.dataset.id)
    }

    // if (options.sendMouseover) {
    //     await sendMouseover(event)
    // }
    if (options.showTooltipMouseover) {
        await showTooltipMouseover(event)
    }
    if (options.showMouseover) {
        await showMouseover(event)
    }
}

// /**
//  * Send Chat Message Mouse Over Handler
//  * @function sendMouseover
//  * @param {MouseEvent} event
//  */
// async function sendMouseover(event) {
//     // if (
//     //     event.target.tagName !== 'IMG' ||
//     //     !event.target.parentNode?.dataset?.id
//     // ) {
//     //     return
//     // }
//
//     // check if this mouse over is in chat
//     const parent =
//         event.target.parentNode.parentNode.parentNode.parentNode.parentNode
//             .parentNode
//     if (parent.dataset.testid !== 'app-layout-aside') {
//         return
//     }
//     const userID = event.target.parentNode.dataset.id
//     await sendStatsChat(userID)
// }

/**
 * Show Tooltip on Mouse Over Handler
 * @function showTooltipMouseover
 * @param {MouseEvent} event
 */
async function showTooltipMouseover(event) {
    // if (
    //     event.target.tagName !== 'IMG' ||
    //     !event.target.parentNode?.dataset?.id
    // ) {
    //     if (tooltip.style.display !== 'none') {
    //         console.debug('hide tooltip')
    //         tooltip.style.display = 'none'
    //         tooltip.innerHTML = 'Loading...'
    //     }
    //     return
    // }
    if (tooltip.style.display === 'block') {
        return
    }
    // console.debug('show tooltip')
    tooltip.style.display = 'block'
    instance.update()
    const userID = event.target.parentNode.dataset.id
    const profile = await getProfile(userID)
    const stats = calStats(profile)
    tooltip.innerHTML = ''
    const span = document.createElement('span')
    span.style.width = '100%'
    span.style.display = 'inline-block'
    const span1 = span.cloneNode(true)
    span1.textContent = profile.username
    tooltip.appendChild(span1)
    const span2 = span.cloneNode(true)
    span2.textContent = `Rating: ${stats.rating} - ${stats.wl_percent}%`
    if (profile.rating < 200) {
        span2.style.color = '#EE4B2B'
    } else {
        span2.style.color = '#50C878'
    }
    tooltip.appendChild(span2)
    const span3 = span.cloneNode(true)
    span3.textContent = `W/L: ${stats.games_won} / ${stats.games_lost}`
    if (stats.wl_percent < 45) {
        span3.style.color = '#EE4B2B'
    } else {
        span3.style.color = '#50C878'
    }
    tooltip.appendChild(span3)
}

/**
 * Show Profile on Mouse Over Handler
 * @function sendChatMouseover
 * @param {MouseEvent} event
 */
async function showMouseover(event) {
    // if (
    //     event.target.tagName !== 'IMG' ||
    //     !event.target.parentNode?.dataset?.id
    // ) {
    //     return
    // }
    const element = event.target.parentNode
    if (element.dataset.processed) {
        // console.debug('already processed element:', element)
        return
    }
    element.dataset.processed = 'yes'
    element.parentNode.style.position = 'relative'

    const userID = element.dataset.id
    // console.debug('userID', userID)
    const profile = await getProfile(userID)
    const stats = calStats(profile)
    const div = document.createElement('div')
    div.style.position = 'absolute'
    div.style.marginTop = '-3px'
    div.style.textAlign = 'center'
    div.style.width = '40px'
    div.style.fontSize = '16px'
    div.style.pointerEvents = 'none'
    div.classList.add('mouseover-stats')

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
 * Send Stats to Chat One Time
 * @function sendStatsChat
 * @param {string} playerID
 */
async function sendStatsChat(playerID) {
    const aside = document.querySelector('aside')
    const sent = aside.querySelector(`#userid-${playerID}`)
    if (sent) {
        console.debug('already sent stats for playerID:', playerID)
        return
    }
    const div = document.createElement('div')
    div.style.display = 'none'
    div.id = `userid-${playerID}`
    aside.appendChild(div)
    await sendPlayerStats(playerID)
}

/**
 * Send Player Stats to Chat
 * @function sendPlayerStats
 * @param {string} playerID
 */
async function sendPlayerStats(playerID) {
    const profile = await getProfile(playerID)
    const stats = calStats(profile)
    await sendChatMessage(stats.text)
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
 * TODO: Make this an Interval that cancels once complete
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
    const profile = await getProfile(userId)
    await updateUserProfile(profile)
}

/**
 * Update User History Interval - 3 minutes
 * @function updateUserInterval
 */
async function updateUserInterval() {
    // console.debug('updateUserInterval')
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
        if (age < 150) {
            // console.debug('using cached profile, age:', age)
            return profiles[profileID]
        }
        // console.debug('cached profile expired, age:', age)
    }
    const profileUrl = `https://api-v2.playdrift.com/api/profile/trpc/profile.get?input=%7B%22id%22%3A%22${profileID}%22%2C%22game%22%3A%22dominoes%22%7D`
    // console.debug('profileUrl:', profileUrl)
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
    const historyMax = 80
    await chrome.storage.sync.set({ profile })
    // userProfile = profile

    const { history } = await chrome.storage.sync.get(['history'])
    console.debug('Updating User Profile:', profile, history)
    const last = history.slice(-1)[0]
    const current = {
        rating: profile.rating,
        games_won: profile.games_won,
        games_lost: profile.games_lost,
        ts_last: profile.ts_last,
        win: false,
    }
    // console.debug('last, current:', last, current)
    if (
        !last ||
        last.games_won + last.games_lost !==
            current.games_won + current.games_lost
    ) {
        if (last && current.games_won > last.games_won) {
            current.win = true
        }
        console.info('Adding New Game:', current)
        history.push(current)
        if (history.length > historyMax) {
            history.splice(0, history.length - historyMax)
        }
        await chrome.storage.sync.set({ history })
    }
}

/**
 * copyClick Callback
 * @function saveOptions
 * @param {Object} profile
 * @param {Array} banned
 */
function updateProfile(profile, banned) {
    // console.debug('updateProfile:', profile, banned)
    document
        .querySelector('.MuiDialog-container')
        .addEventListener('click', profileCloseClick)

    const root = document
        .querySelector('.MuiDialog-container')
        .querySelectorAll('.MuiBox-root')[4]
    if (!root) {
        return console.warn('root not found')
    }
    root.style.marginTop = 0
    root.style.marginBottom = '10px'

    const divText = document.createElement('div')
    divText.style.textAlign = 'center'

    const stats = calStats(profile)

    const spanStats = document.createElement('span')
    spanStats.id = 'stats-text'
    spanStats.textContent = stats.text
    spanStats.hidden = true
    divText.appendChild(spanStats)

    const spanRating = document.createElement('span')
    spanRating.style.color = stats.rating < 200 ? '#EE4B2B' : '#50C878'
    spanRating.textContent = ` Rating: ${stats.rating} `
    divText.appendChild(spanRating)

    const spanGames = document.createElement('span')
    spanGames.style.color = stats.wl_percent < 45 ? '#EE4B2B' : '#50C878'
    // spanGames.id = 'stats-text'
    spanGames.textContent = ` W/L: ${stats.games_won.toLocaleString()} / ${stats.games_lost.toLocaleString()} (${stats.wl_percent}%) `
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

    if (!banned.includes(profile.id)) {
        const banButton = button.cloneNode(true)
        banButton.addEventListener('click', banClick)
        banButton.textContent = 'Ban'
        divBtns.appendChild(banButton)
    } else {
        const banButton = button.cloneNode(true)
        banButton.addEventListener('click', unbanClick)
        banButton.textContent = 'Unban'
        divBtns.appendChild(banButton)
    }

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
    const text = document.getElementById('stats-text')?.textContent
    if (text) {
        console.log(`Copied: ${text}`)
        navigator.clipboard.writeText(text).then()
        history.back()
    }
}

/**
 * Send Chat Click Callback
 * @function saveOptions
 * @param {MouseEvent} event
 */
function sendClick(event) {
    console.debug('sendClick:', event)
    const text = document.getElementById('stats-text')?.textContent
    if (text) {
        console.debug(`Sending: ${text}`)
        sendChatMessage(text).then()
        history.back()
    }
}

/**
 * Send Chat and Kick Click Callback
 * @function sendKickClick
 * @param {MouseEvent} event
 */
async function sendKickClick(event) {
    const playerID = document.getElementById('profile-id').value
    console.debug('sendKickClick:', playerID, event)
    await kickPlayer(playerID)
    // sendClick(event)
    await sendChatMessage(`Kicked Player: ${profiles[playerID] || playerID}`)
}

/**
 * Kick Click Callback
 * @function kickClick
 * @param {MouseEvent} event
 */
async function kickClick(event) {
    const playerID = document.getElementById('profile-id').value
    console.debug('kickClick:', playerID, event)
    await kickPlayer(playerID)
    history.back()
}

/**
 * Ban Click Callback
 * @function banClick
 * @param {MouseEvent} event
 */
async function banClick(event) {
    const playerID = document.getElementById('profile-id').value
    const { banned } = await chrome.storage.sync.get(['banned'])
    console.debug('banClick:', playerID, banned, event)
    if (!banned.includes(playerID)) {
        banned.push(playerID)
        await chrome.storage.sync.set({ banned })
    }
    const name = profiles[playerID]?.username || playerID
    await sendChatMessage(`Banned User: ${name}`)
    await kickPlayer(playerID)
    history.back()
}

/**
 * Unban Click Callback
 * @function unbanClick
 * @param {MouseEvent} event
 */
async function unbanClick(event) {
    const playerID = document.getElementById('profile-id').value
    const { banned } = await chrome.storage.sync.get(['banned'])
    console.debug('banClick:', playerID, banned, event)
    const index = banned.indexOf(playerID)
    if (index !== undefined) {
        banned.splice(index, 1)
        await chrome.storage.sync.set({ banned })
    }
    history.back()
}

/**
 * Kick a Player by ID
 * @function kickPlayer
 * @param {string} playerID
 */
async function kickPlayer(playerID) {
    console.debug('kickPlayer:', playerID)
    const { profile } = await chrome.storage.sync.get(['profile'])
    const room = rooms[currentRoom]
    const owner = room?.players.length && room.players[0] === profile.id
    if (!owner || room.kicked.includes(playerID)) {
        return console.debug('not owner or user already kicked')
    }
    const url = `https://api-v2.playdrift.com/api/v1/room/dominoes%23v3/${currentRoom}/action/kick`
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
async function sendChatMessage(message) {
    const tid = rooms[currentRoom]?.tid
    console.debug('sendChatMessage:', currentRoom, tid, message)
    if (!tid) {
        return sendChatMessageLegacy(message)
    }
    const url = `https://api-v2.playdrift.com/api/v1/chat/${tid}/send`
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message }),
    })
    const data = await response.json()
    console.debug('data:', data)
}

/**
 * Send a Chat Message
 * @function sendChatMessage
 * @param {string} message
 */
function sendChatMessageLegacy(message) {
    console.log(`sendChatMessageLegacy: ${message}`)
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
