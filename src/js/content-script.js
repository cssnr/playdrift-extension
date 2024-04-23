// JS Content Script

console.info('RUNNING content-script.js')

// chrome.storage.onChanged.addListener(onChanged)
chrome.runtime.onMessage.addListener(onMessage)

document.addEventListener('mouseover', documentMouseover)

// Intervals and Timeouts
setTimeout(processLoad, 3000)
setInterval(updateUserInterval, 2 * 60000)
let userIntervalID = setInterval(setUserProfile, 1000)

// SSE
let source1
let source2
let source3
let source4

// State
const profilesCache = {}
const roomState = {}
let stickyTeams = {} // TODO: This should probably cleared on processRoom
let currentRoom = ''
let randID = (Math.random() + 1).toString(36).substring(2)

// Audio
const speech = new SpeechSynthesisUtterance()
const audio = {
    inbox: new Audio(chrome.runtime.getURL('/audio/inbox.mp3')),
    join: new Audio(chrome.runtime.getURL('/audio/join.mp3')),
    leave: new Audio(chrome.runtime.getURL('/audio/leave.mp3')),
    message: new Audio(chrome.runtime.getURL('/audio/message.mp3')),
    team: new Audio(chrome.runtime.getURL('/audio/team.mp3')),
    turn: new Audio(chrome.runtime.getURL('/audio/turn.mp3')),
}

// Popper Tooltip
const tooltip = document.createElement('div')
tooltip.id = 'tooltip'
tooltip.style.width = '190px'
tooltip.setAttribute('role', 'tooltip')
tooltip.innerHTML = 'Loading...'
document.body.appendChild(tooltip)

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
        width: 190,
        height: 0,
        top: y - 10,
        right: x,
        bottom: y,
        left: x + 20,
    })
}

// // async
// ;(async () => {
//     console.info('ASYNC content-script.js')
//     const { options, profile } = await chrome.storage.sync.get([
//         'options',
//         'profile',
//     ])
//     console.debug('options, profile:', options, profile)
// })()

// window.addEventListener('load', function load(event) {
//     console.info('window.load EventListener', event)
//     window.removeEventListener('load', load)
// })

document.addEventListener('blur', function blur(event) {
    // console.debug('documentBlur', event)
    // document.removeEventListener('blur', blur)
    tooltip.style.display = 'none'
    instance.update()
})

async function processLoad() {
    // const homeHeader = document.querySelector(
    //     'div[data-testid="home-header-backdrop"]'
    // )
    // homeHeader.style.backgroundImage = 'none'
    const app = document.getElementById('app')
    console.info('processLoad:', app)

    // TODO:    Not sure why this does not reliably load...
    //          Will most likely move back to Tabs onMessage
    // setTimeout(startMutation, 3000)
    startMutation()

    await sse4()

    // const menu = document.querySelector(
    //     '.MuiPopover-paper.MuiMenu-paper.MuiMenu-paper ul'
    // )
    // const item = menu.children[0].cloneNode(true)
    // item.textContent = 'PlayDrift Home'
    // item.href = chrome.runtime.getURL('/html/home.html')
    // menu.insertBefore(item, menu.children[1])

    const url = new URL(window.location.href)
    if (url.searchParams.has('profile')) {
        // TODO: Direct Loads do not trigger the MutationObserver
        console.info('Profile Only View')
        const pid = url.searchParams.get('profile')
        console.debug('pid:', pid)

        // const container = document.querySelector('.MuiDialog-container')
        // console.debug('container:', container)

        // const parent = container?.querySelectorAll('.MuiBox-root')[4]
        // console.debug('parent:', parent)
        // await updateProfile(parent)

        await updateProfile()
    } else if (url.pathname.includes('/room/')) {
        // TODO: This is not yet on a MutationObserver (but might not work on direct loads)
        // TODO: This code is Copy Pasta - make into a function
        console.info('Direct Room View')
        const split = url.pathname.split('/')
        const room = split[2]
        const game = split[3]
        console.debug('room, game:', room, game)
        currentRoom = room
        // console.debug('SET currentRoom:', currentRoom)
        if (room) {
            setTimeout(processRoom, 250, room)
        }
        if (game) {
            await processGame(game)
        }
    }
}

function startMutation() {
    // const app = document.getElementById('app')
    const element = document.body
    console.info('startMutation: element:', element)
    const observer = new MutationObserver(mutationCallback)
    observer.observe(element, {
        // attributes: true,
        // characterData: true,
        childList: true,
        subtree: true,
        // attributeOldValue: true,
        // characterDataOldValue: true,
    })

    function mutationCallback(mutationList, observer) {
        // console.info('mutationCallback, mutationList:', mutationList, observer)
        for (const mutation of mutationList) {
            if (mutation.type === 'childList' && mutation.addedNodes) {
                mutation.addedNodes.forEach((el) => {
                    // console.info('mutation:', mutation)
                    if (
                        mutation.target.children.length > 5 &&
                        mutation.target.children[2].nodeName === 'H5'
                    ) {
                        // let parent = mutation.target.children[4]
                        // updateProfile(parent).then()
                        // const container =
                        //     mutation.target.parentElement.parentElement
                        //         .parentElement
                        // updateProfile(container).then()
                        updateProfile().then()
                    }
                    // // TODO: Detect aside for onMessage replacement
                    // if (mutation.target.tagName === 'ASIDE') {
                    //     console.info('ASIDE')
                    // }
                    // document.querySelectorAll('button[data-testid="button-continue"]')
                    if (mutation.target.dataset.testid === 'button-continue') {
                        // console.info('button-continue:', mutation.target)
                        setTimeout(buttonContinue, 150, mutation.target)
                        setTimeout(buttonContinue, 250, mutation.target)
                    }
                    if (typeof mutation.target.dataset.team !== 'undefined') {
                        console.debug('Adding Listener teamChangeClick')
                        mutation.target.addEventListener(
                            'click',
                            teamChangeClick
                        )
                    }
                    if (
                        mutation.target.tagName === 'LI' &&
                        mutation.target.textContent === 'Kick' &&
                        mutation.target.dataset.pid
                    ) {
                        processKickButton(mutation.target)
                    }
                })
            }
        }
    }
}

/**
 * @function processKickButton
 * @param  {HTMLElement} element
 */
function processKickButton(element) {
    const parent = element.parentElement
    const pid = element.dataset.pid
    console.log(`processKickButton: ${pid}:`, element, parent)
    const options = [
        { txt: 'Low Total Games', msg: 'low total games.' },
        { txt: 'Low Win Rate', msg: 'low win rate.' },
        { txt: 'Bad Player', msg: 'poor performance.' },
        { txt: 'Possible Bot', msg: 'possible robot player.' },
    ]
    for (const option of options) {
        genKickItem(option.txt, option.msg, pid, element)
    }
}

function genKickItem(text, message, pid, element) {
    const li = element.cloneNode(true)
    li.dataset.message = message
    li.dataset.pid = pid
    li.addEventListener('click', kickDropDownCallback)
    li.textContent = text
    element.parentElement.appendChild(li)
}

async function kickDropDownCallback(event) {
    console.log('kickDropDownCallback', event)
    event.preventDefault()
    // console.log('event.target.parentElement', event.target.parentElement)
    event.target.parentElement.children[0].click()
    const pid = event.target.dataset.pid
    const message = event.target.dataset.message
    console.log('pid', pid)
    const player = await getProfile(pid, true)
    const msg = `Kicked: ${player.username} due to: ${message}`
    await sendChatMessage(msg)
}

async function teamChangeClick(event) {
    // console.debug('teamChangeClick', event)
    const { options } = await chrome.storage.sync.get(['options'])
    if (!options.stickyTeams) {
        // console.debug('Sticky Teams Disabled')
        return
    }
    const li = event.target.closest('li')
    const team = li.dataset.team
    console.debug('team:', team)
    if (!team) {
        stickyTeams = {}
        console.debug('Sticky Team Unset', stickyTeams)
    } else {
        stickyTeams[`${currentRoom}`] = team
        console.debug(`Sticky Team Change to ${team}:`, stickyTeams)
    }
}

// /**
//  * On Changed Callback
//  * @function onChanged
//  * @param {Object} changes
//  * @param {String} namespace
//  */
// function onChanged(changes, namespace) {
//     console.debug('onChanged:', changes, namespace)
//     // for (const [key, { newValue }] of Object.entries(changes)) {
//     //     if (namespace === 'sync' && key === 'options') {
//     //         console.debug('newValue:', newValue)
//     //     }
//     // }
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
    if (!message.url) {
        return console.warn('No message.url')
    }
    const url = new URL(message.url)
    if (url.searchParams.get('profile')) {
        console.debug('this handler has been moved to a MutationObserver')
        // const profileID = url.searchParams.get('profile')
        // // console.debug('profileID', profileID)
        // const profile = await getProfile(profileID)
        // const { banned } = await chrome.storage.sync.get(['banned'])
        // setTimeout(updateProfile, 250, profile, banned)
    } else if (url.pathname.includes('/room/')) {
        // TODO: Look into moving this to a MutationObserver
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
        closeEventSources()
        document.getElementById('tracker-container')?.remove()
    }
}

/**
 * Close All Event Sources
 * @function closeEventSources
 */
function closeEventSources() {
    // TODO: This can be done at the sse function level
    if (source1?.readyState === 1) {
        source1.close()
        console.debug('close source1', source1)
    }
    if (source2?.readyState === 1) {
        source2.close()
        console.debug('close source2', source2)
    }
    if (source3?.readyState === 1) {
        source3.close()
        console.debug('close source3', source3)
    }
}

/**
 * Process Room Handler
 * TODO: Refactor this function to check source1 connection
 * @function processRoom
 * @param {String} room
 */
async function processRoom(room) {
    const { options, profile } = await chrome.storage.sync.get([
        'options',
        'profile',
    ])
    // TODO: Safe to re-run this because it checks for existence before creating
    if (options.addCancelReadyBtn) {
        await addCancelReadyBtn()
    }

    // const parent = document.querySelector('div[data-testid="room"]')
    // console.debug('parent:', parent)
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

    if (options.autoUpdateOptions) {
        // const root = parent?.querySelector(
        //     '.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded'
        // )
        // // console.debug('root:', root)
        // root?.querySelector('button')?.click()
        clickUpdateOptions()
    }

    if (roomState[currentRoom]) {
        if (roomState[currentRoom].kicked?.includes(profile.id)) {
            processYouKicked()
        }
    }

    // TODO: Add Option to Auto Select Team
    // await selectTeam(room, '1')

    // TODO: Query Selectors for Player Box in Room
    // const parent = document.querySelector('div[data-testid="room"]')
    // const user = parent.querySelector(`div[data-id="${profile}"].MuiPaper-root`)

    // TODO: Query Selectors for Players header to add kicked players
    // parent.querySelector('div[data-testid="home-header"]')
    // parent.querySelector('.MuiTypography-h5')
    //
    // TODO: Use Mutation Events
    // app.querySelectorAll('div[data-id].MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded')
}

async function addCancelReadyBtn() {
    // console.debug('addCancelReadyBtn')
    const cancelBtn = document.getElementById('ready-cancel-button')
    if (cancelBtn) {
        // console.debug('Cancel Button Already Added')
        return
    }
    // const { profile } = await chrome.storage.sync.get(['profile'])
    // if (!roomState[currentRoom]) {
    //     // console.debug('No Room State')
    //     return
    // }
    // if (roomState[currentRoom].pids[0] !== profile.id) {
    //     // console.debug('Skipping Cancel Button, Not Room Owner')
    //     return
    // }
    const homeHeader = document.querySelector('div[data-testid="home-header"]')
    // const source = homeHeader?.querySelector('button')
    const source = homeHeader?.querySelector(
        'button.MuiButton-outlinedSecondary'
    )
    if (!source) {
        // console.debug('return on no ready button')
        return
    }
    // console.log('source', source)
    const btn = source.cloneNode(true)
    const span = source.querySelector('.MuiTouchRipple-root')?.cloneNode(true)
    // console.log('span', source)
    if (!span) {
        // console.debug('no options button - not owner')
        return
    }
    btn.appendChild(span)
    btn.id = 'ready-cancel-button'
    btn.textContent = 'Cancel'
    // btn.classList.add('MuiButton-containedError')
    // btn.style.backgroundColor = '#e57373'
    btn.addEventListener('click', clickUpdateOptions)
    source.parentElement.parentElement.insertBefore(btn, source.parentElement)
}

/**
 * Click Update Game Options Button
 * @function clickUpdateOptions
 */
function clickUpdateOptions() {
    const parent = document.querySelector('div[data-testid="room"]')
    const root = parent?.querySelector(
        '.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded'
    )
    root?.querySelector('button')?.click()
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
    const { options } = await chrome.storage.sync.get(['options'])
    if (options.showRemainingDominoes) {
        addDominoes()
    }
    await sse3(game)
}

/**
 * Server-Sent Event Room Handler
 * @function sse1
 * @param {String} room
 */
async function sse1(room) {
    const url = `https://api-v2.playdrift.com/api/v1/room/dominoes%23v3/${room}/sse`
    console.debug('connecting to sse1 url:', url)
    if (source1?.readyState === 1 && source1?.url === url) {
        return console.info('source1 already connected at:', source1.url)
    }
    source1 = new EventSource(url, {
        withCredentials: true,
    })
    const { options, profile } = await chrome.storage.sync.get([
        'options',
        'profile',
    ])
    console.debug('Adding Listener to: source1')
    source1.addEventListener('msg', function (event) {
        const msg = JSON.parse(event.data)
        // console.debug('sse1:', msg)
        const state = msg.state
        if (msg.t === 'rs' && state?.tid) {
            // roomStateUpdate(room, state)
            // TODO: This Fires Multiple Times as a Function
            // console.debug('Room state:', state)
            if (roomState[room]) {
                if (!roomState[room].game && state.game) {
                    gameStart(state).then()
                }
                if (roomState[room].game && !state.game) {
                    gameEnd(state).then()
                }
                if (roomState[room].players.length !== state.players.length) {
                    roomPlayerChange(roomState[room], state).then()
                }
                if (roomState[room].kicked.length !== state.kicked.length) {
                    roomKickedChange(roomState[room], state).then()
                }
                // if (
                //     cmpArrays(roomState[room].teamsAvailable, state.teamsAvailable)
                // ) {
                //     console.info('Teams Changed - Array')
                // }
                if (cmpObjects(roomState[room].teams, state.teams)) {
                    // console.info('Teams Changed - Object')
                    roomTeamsChanged(roomState[room], state).then()
                }
            }
            roomState[room] = state
        }
        if (msg.t === 'helo') {
            // TODO: This Needs to be Stateful
            setTimeout(sse2, 250, room)
            if (options.sendSelfOnJoin) {
                setTimeout(sendPlayerStats, 250, profile.id)
            }
            // if (options.addCancelReadyBtn) {
            //     setTimeout(addCancelReadyBtn, 250)
            // }
        }
    })
}

/**
 * Server-Sent Event Chat Handler
 * @function sse2
 * @param {String} room
 */
async function sse2(room) {
    if (!roomState[room]?.tid) {
        return console.warn('room tid not in roomState:', room, roomState)
    }
    const url = `https://api-v2.playdrift.com/api/v1/chat/messages/${roomState[room].tid}/sse`
    console.debug('connecting to sse2 url:', url)
    if (source2?.readyState === 1 && source2?.url === url) {
        return console.info('source2 already connected at:', source2.url)
    }
    source2 = new EventSource(url, {
        withCredentials: true,
    })
    // TODO: Checking date might not be necessary!
    const now = Date.now()
    console.debug('Adding Listener to: source2')
    source2.addEventListener('msg', function source2Listener(event) {
        const msg = JSON.parse(event.data)
        // console.debug('sse2:', msg)
        // console.debug(`${msg.json?.ts} > ${now}`, msg.json?.ts > now)
        if (msg.t === 'm' && msg.json?.ts > now) {
            newChatMessage(msg).then()
        }
    })
}

// function source2Listener(event) {
//     const msg = JSON.parse(event.data)
//     // console.debug('sse2:', msg)
//     // console.debug(`${msg.json?.ts} > ${now}`, msg.json?.ts > now)
//     if (msg.t === 'm' && msg.json?.ts > now) {
//         newChatMessage(msg).then()
//     }
// }

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
    // const rand = (Math.random() + 1).toString(36).substring(2)
    const url = `https://api-v2.playdrift.com/api/v1/game/${game}/sse?sseid=${randID}`
    console.debug('connecting to sse3 url:', url)
    if (source3?.readyState === 1 && source3?.url === url) {
        return console.info('source3 already connected at:', source3.url)
    }
    source3 = new EventSource(url, {
        withCredentials: true,
    })
    console.debug('Adding Listener to: source3')
    source3.addEventListener('msg', (event) => {
        const msg = JSON.parse(event.data)
        // console.debug('sse3:', msg)
        if (msg.t === 's') {
            processGameState(msg.s)
        }
        if (msg.t === 'a') {
            processGameAction(msg.a)
        }
    })
}

async function processGameState(state) {
    // console.debug('processGameState:', state)
    const { options, profile } = await chrome.storage.sync.get([
        'options',
        'profile',
    ])
    if (options.showRemainingDominoes) {
        if (state.first !== -1) {
            // console.debug('first:', state.first)
            $(`#domino-${state.first}`).fadeTo('slow', 0.2)
        }
        for (const [key, value] of Object.entries(state.trees)) {
            // console.log(`key: ${key} | value:`, value)
            for (const bone of value.bones) {
                // console.debug(`bone: ${bone}`)
                $(`#domino-${bone}`).fadeTo('slow', 0.2)
            }
        }
        if (options.hideOwnDominoes) {
            // console.debug('hideOwnDominoes:', state.hands[profile.id])
            if (state.hands[profile.id]) {
                for (const own of state.hands[profile.id]) {
                    // console.debug(`own: ${own}`)
                    $(`#domino-${own}`).fadeTo('slow', 0.2)
                }
            }
            // for (const hand of state.hands) {
            //     // $(`#domino-${action.bid}`).fadeTo('slow', 0.2)
            // }
        }
    }
}

async function processGameAction(action) {
    // console.debug('processGameAction:', action)
    const { options, profile } = await chrome.storage.sync.get([
        'options',
        'profile',
    ])
    if (action.t === 'round') {
        if (options.showRemainingDominoes) {
            // console.debug('round:', action)
            // $('.tracker-domino').show()
            $('.tracker-domino').fadeTo('slow', 1.0)
        }
    }
    if (action.t === 'draw') {
        if (action.pid === profile.id) {
            if (options.showRemainingDominoes && options.hideOwnDominoes) {
                // $('.tracker-domino').show()
                $(`#domino-${action.bid}`).fadeTo('slow', 0.2)
            }
        }
    }
    if (action.t === 'move') {
        // console.debug(
        //     `bid ${action.bid} - ${bidMap[action.bid]} on tree ${msg.a.tree}: ${treeMap[msg.a.tree]}`
        // )
        if (options.showRemainingDominoes) {
            // console.log('bid:', action.bid)
            $(`#domino-${action.bid}`).fadeTo('slow', 0.2)
        }
    }
    if (action.t === 'player') {
        if (action.pid === profile.id) {
            if (options.playTurnAudio) {
                audio.turn.play().then()
            }
        }
    }
}

function addDominoes() {
    // console.debug('addDominoes')
    if (document.getElementById('tracker-container')) {
        // console.debug('return on tracker-container already exist')
        return
    }
    const app = document.getElementById('app')
    const div = document.createElement('div')
    div.id = 'tracker-container'
    // div.classList.add('tracker-container')
    app.insertBefore(div, app.children[0])
    for (let i = 0; i < 28; i++) {
        const el = genDomino(i)
        div.appendChild(el)
    }
}

function genDomino(id) {
    // console.debug(`genDomino: ${id}`)
    const img = document.createElement('img')
    img.id = `domino-${id}`
    img.classList.add('tracker-domino')
    img.src = chrome.runtime.getURL(`/images/bones/${id}.png`)
    return img
}

/**
 * Server-Sent Event Inbox Handler
 * @function sse4
 */
async function sse4() {
    const url = 'https://api-v2.playdrift.com/api/v1/chat/inbox/sse'
    console.debug('connecting to sse4 url:', url)
    if (source4?.readyState === 1 && source4?.url === url) {
        return console.info('source4 already connected at:', source4.url)
    }
    source4 = new EventSource(url, {
        withCredentials: true,
    })
    // console.debug('source2:', source2)
    const { options, profile } = await chrome.storage.sync.get([
        'options',
        'profile',
    ])
    const now = Date.now()
    console.debug('Adding Listener to: source1', now)
    source4.addEventListener('msg', function (event) {
        const msg = JSON.parse(event.data)
        // console.debug('sse4:', msg)
        if (msg.t === 'm' && msg.json?.ts > now) {
            if (options.playInboxAudio && msg.json.cid !== profile.id) {
                // newInboxMessage(msg.json)
                console.debug('New Message:', msg)
                audio.inbox.play().then()
            }
        }
    })
}

// /**
//  * New Inbox Message Handler
//  * @function newInboxMessage
//  * @param {Object} msg
//  */
// function newInboxMessage(msg) {
//     console.log('newInboxMessage:', msg)
// }

/**
 * Room Player Update Handler
 * @function roomPlayerChange
 * @param {Object} before
 * @param {Object} after
 */
async function roomPlayerChange(before, after) {
    console.debug('roomPlayerChange:', before, after)
    const left = []
    const joined = []
    for (const player of before.players) {
        if (!after.players.includes(player)) {
            left.push(player)
        }
    }
    await playersLeaveRoom(after, left)
    for (const player of after.players) {
        if (!before.players.includes(player)) {
            joined.push(player)
        }
    }
    await playersJoinRoom(after, joined)
}

/**
 * Players Leave Room Handler
 * @function playersLeaveRoom
 * @param {Object} state
 * @param {Array} players
 */
async function playersLeaveRoom(state, players) {
    if (!players.length) {
        return
    }
    // console.debug('playersLeaveRoom:', state, players)
    const { options } = await chrome.storage.sync.get(['options'])
    if (options.playPlayersAudio) {
        await audio.leave.play()
    }
    const pids = state.game?.gameOptions?.pids
    if (options.sendPlayerLeft && pids) {
        console.debug(`${players.length} players left during game`)
        for (const pid of players) {
            if (pids.includes(pid)) {
                const profile = await getProfile(pid, true)
                const message = `${profile.username} left the game.`
                await sendChatMessage(message)
            }
        }
    }
}

/**
 * Players Join Room Handler
 * @function playersJoinRoom
 * @param {Object} state
 * @param {Array} players
 */
async function playersJoinRoom(state, players) {
    if (!players.length) {
        return
    }
    // console.debug('playersJoinRoom:', state, players)
    const { options } = await chrome.storage.sync.get(['options'])
    if (options.playPlayersAudio) {
        await audio.join.play()
    }
    for (const pid of players) {
        await userJoinRoom(pid)
    }
}

/**
 * Room Player Kicked Handler
 * @function roomKickedChange
 * @param {Object} before
 * @param {Object} after
 */
async function roomKickedChange(before, after) {
    console.debug('roomKickedChange:', before, after)
    const kicked = []
    for (const pid of after.kicked) {
        if (!before.kicked.includes(pid)) {
            kicked.push(pid)
        }
    }
    console.debug('kicked players:', kicked)
    const { options, profile } = await chrome.storage.sync.get([
        'options',
        'profile',
    ])
    const pids = after.game?.gameOptions?.pids
    const owner = after?.players.length && after.players[0] === profile.id
    for (const pid of kicked) {
        if (!owner && options.sendPlayerKicked) {
            if (!(profile.id === pid && !options.sendSelfKicked)) {
                const player = await getProfile(pid, true)
                await sendChatMessage(`${player.username} was kicked.`)
            }
        }
        if (profile.id === pid) {
            console.info('1 - You were KICKED in ROOM')
            processYouKicked()
        }
    }
    if (pids) {
        console.debug(`${kicked.length} players kicked during game`)
        for (const pid of kicked) {
            if (pids.includes(pid)) {
                const player = await getProfile(pid, true)
                const message = `${player.username} was kicked from the game.`
                if (profile.id === pid) {
                    console.info('2 - You were KICKED in GAME')
                }
                if (options.sendPlayerLeft) {
                    await sendChatMessage(message)
                }
            }
        }
    }
}

/**
 * Room Teams Changed Handler
 * @function roomTeamsChanged
 * @param {Object} before
 * @param {Object} after
 * @return {Boolean}
 */
async function roomTeamsChanged(before, after) {
    console.debug('roomTeamsChanged:', before, after)
    // if (after.game) {
    //     return console.debug('not sending team change because game active')
    // }
    const { options, profile } = await chrome.storage.sync.get([
        'options',
        'profile',
    ])
    // TODO: We can probably skip checking this during game and leave it down here
    if (
        !(
            options.sendTeamsChanged ||
            options.playTeamsAudio ||
            options.stickyTeams
        )
    ) {
        return console.debug('no team options set')
    }
    for (const pid of after.players) {
        if (before.teams[pid] === after.teams[pid]) {
            continue
        }
        const player = await getProfile(pid, true)
        const from = before.teams[pid] ? `Team ${before.teams[pid]}` : 'No Team'
        const to = after.teams[pid] ? `Team ${after.teams[pid]}` : 'No Team'
        if (options.stickyTeams && player.id === profile.id) {
            if (
                stickyTeams[currentRoom] &&
                after.teams[pid] !== stickyTeams[currentRoom]
            ) {
                console.log('StickyTeams Intercept')
                await selectTeam(currentRoom, stickyTeams[currentRoom])
            }
            return console.debug('Stop Processing on Sticky Teams Event')
        }
        if (!after.game && options.playTeamsAudio) {
            await audio.team.play()
        }
        if (!after.game && options.sendTeamsChanged) {
            await sendChatMessage(
                `${player.username} Changed from ${from} to ${to}`
            )
        }
    }
}

/**
 * Process You Being Kicked
 * @function processYouKicked
 */
function processYouKicked() {
    console.info('processYouKicked', roomState[currentRoom])
    document.querySelector('aside .MuiPaper-root').style.backgroundColor =
        '#600000'
}

/**
 * Game Start Handler
 * @function gameStart
 * @param {Object} state
 */
async function gameStart(state) {
    console.info('Game Start:', state.game.id, state)
    const { options, profile } = await chrome.storage.sync.get([
        'options',
        'profile',
    ])
    // console.debug('options, profile:', options, profile)
    if (state.game.gameOptions.teams) {
        // TODO: Requires Processing of state.game.teams
        console.info('Teams:', state.game.gameOptions.teams)
        // TODO: Make this an Option with Customizable Text
    }
    if (
        options.sendGameStart &&
        state.game.gameOptions.pids.includes(profile.id)
    ) {
        console.info('You are Playing in this Game!')
        await sendChatMessage(options.gameStartMessage)
    }
}

/**
 * Game End Handler
 * @function gameEnd
 * @param {Object} state
 */
async function gameEnd(state) {
    console.debug('Game End:', state)
    // Hide Domino Tracker
    document.getElementById('tracker-container')?.remove()
    // Game Results
    const result = await getGameResults(state)
    console.log('result:', result)
    // Process Own Game Results
    const { options, profile } = await chrome.storage.sync.get([
        'options',
        'profile',
    ])
    if (state.gameResult.players.includes(profile.id)) {
        console.info('You were Playing in this Game!')
        await processPlayerGame(state)
        if (options.sendGameStart) {
            await sendChatMessage(result)
        }
        // if (
        //     options.stickyTeams &&
        //     stickyTeams[currentRoom] &&
        //     state.teams[profile.id] !== stickyTeams[currentRoom]
        // ) {
        //     console.info('StickyTeams End-of-Game Check')
        //     await selectTeam(currentRoom, stickyTeams[currentRoom])
        // }
    }
}

/**
 * Process Player Game Results Handler
 * @function processPlayerGame
 * @param {Object} state
 */
async function processPlayerGame(state) {
    console.debug('processPlayerGame:', state.gameResult)
    const { profile } = await chrome.storage.sync.get(['profile'])
    const win = state.gameResult.playersWin.includes(profile.id)
    const rating = state.gameResult.ratings[profile.id].rating
    const diff = state.gameResult.ratings[profile.id].diff
    console.info(`Result: ${win.toString()} - Rating: (${rating}) ${diff}`)
}

/**
 * Get Game Results String
 * @function getGameResults
 * @param {Object} state
 * @return {String}
 */
async function getGameResults(state) {
    // console.debug('gameResults:', state.gameResult)
    const players = state.gameResult.players
    const winners = state.gameResult.playersWin
    const ratings = state.gameResult.ratings
    // String Creation
    let won = 'Winners:'
    let lost = 'Losers:'
    for (const pid of players) {
        const player = await getProfile(pid, true)
        if (winners.includes(pid)) {
            won += ` ${player.username} +${ratings[pid].diff} (${ratings[pid].rating}),`
        } else {
            lost += ` ${player.username} ${ratings[pid].diff} (${ratings[pid].rating}),`
        }
    }
    won = won.replace(/,\s*$/, '')
    lost = lost.replace(/,\s*$/, '')
    // Send Results
    // console.info(won)
    // console.info(lost)
    return `${won}; ${lost}`
}

/**
 * New Chat Message Handler
 * @function newChatMessage
 * @param {Object} msg
 */
async function newChatMessage(msg) {
    console.debug('newChatMessage:', msg)
    if (!msg.json) {
        return console.debug('NO msg.json')
    }
    const message = msg.json.message
    const pid = msg.json.cid

    if (message.startsWith('Auto: ')) {
        return console.debug('Ignoring Auto Message')
    }
    if (message.startsWith('Joined the game.')) {
        return console.debug('Join Events Moved to SSE Handler!')
    }

    const { options, profile } = await chrome.storage.sync.get([
        'options',
        'profile',
    ])
    // console.debug('options, profile:', options, profile)

    // const room = roomState[currentRoom]
    // const owner = room?.players.length && room.players[0] === profile.id
    const player = await getProfile(pid, true)
    // console.debug('owner, room, player:', owner, room, player)

    // TODO: Make Custom Commands an Option
    if (options.enableCommands && message.startsWith('!')) {
        let cmd = message.split(' ')[0]
        cmd = cmd.substring(1).toLocaleLowerCase()
        console.log('chat command:', cmd)
        const { commands } = await chrome.storage.sync.get(['commands'])
        let msg
        if (['me', 'profile', 'stats'].includes(cmd)) {
            await sendPlayerStats(pid)
        } else if (cmd.startsWith('kick')) {
            await sendKickedPlayers()
        } else if (cmd === 'id') {
            msg = `${player.username} ID: ${pid}`
        } else if (cmd === 'url') {
            msg = `https://api-v2.playdrift.com/api/profile/trpc/profile.get?input={"id":"${pid}","game":"dominoes"}`
        } else if (commands[cmd]) {
            msg = commands[cmd]
            if (typeof commands[msg] !== 'undefined') {
                msg = commands[msg]
            }
        }
        if (msg) {
            await sendChatMessage(msg)
        }
    } else if (pid !== profile.id) {
        if (options.playChatSpeech) {
            speech.text = message
            window.speechSynthesis.speak(speech)
        } else if (options.playMessageAudio) {
            await audio.message.play()
        }
    }
}

/**
 * User Join Room Handler
 * @function userJoinRoom
 * @param {String} pid Player ID
 * @param {String} rid Room ID
 */
async function userJoinRoom(pid, rid = currentRoom) {
    const player = await getProfile(pid)
    const room = roomState[rid]
    console.debug(`userJoinRoom: ${pid}/${rid}`, player, room)
    const { banned, options, profile } = await chrome.storage.sync.get([
        'banned',
        'options',
        'profile',
    ])
    // console.debug(banned, options, profile)
    const owner = room?.players.length && room.players[0] === profile.id
    if (profile.id === pid) {
        // console.debug('ignoring self user join events')
        return
    }
    if (room?.kicked.includes(pid)) {
        // console.debug('return on kicked user:', pid)
        return
    }
    // const stats = await calStats(player)
    if (owner) {
        if (options.autoKickBanned && banned.includes(pid)) {
            await kickPlayer(pid)
            await sendChatMessage(`Kicked Banned User: ${player.username}`)
            return
        }
        if (
            options.autoKickLowGames &&
            player.stats.games_won + player.stats.games_lost <
                options.kickLowGames
        ) {
            await kickPlayer(pid)
            const ss = `${player.username} ${player.stats.won}/${player.stats.lost} (${player.stats.wl_percent}%)`
            await sendChatMessage(`Kicked Low Total Game Player: ${ss}`)
            return
        }
        if (
            options.autoKickLowRate &&
            player.stats.wl_percent < options.kickLowRate
        ) {
            await kickPlayer(pid)
            const ss = `${player.username} ${player.stats.won}/${player.stats.lost} (${player.stats.wl_percent}%)`
            await sendChatMessage(`Kicked Low Win Rate Player: ${ss}`)
            return
        }
    }
    if (banned.includes(pid)) {
        await sendChatMessage(`Banned User Joined: ${player.username}`)
    }
    if (options.sendOnJoin) {
        await sendStatsChat(pid)
    }
}

async function sendKickedPlayers() {
    const room = roomState[currentRoom]
    if (!room.kicked.length) {
        return await sendChatMessage('No Kicked Players.')
    }
    const players = []
    for (const pid of room.kicked) {
        const player = await getProfile(pid, true)
        players.push(player.username)
    }
    let msg = 'Kicked Players: '
    for (const name of players) {
        msg += `${name}, `
    }
    msg = msg.replace(/,\s*$/, '')
    await sendChatMessage(msg)
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
    if (options.showMouseover || options.showTooltipMouseover) {
        await getProfile(event.target.parentNode.dataset.id)
    }

    if (options.showTooltipMouseover) {
        await showTooltipMouseover(event)
    }
    if (options.showMouseover) {
        await showMouseover(event)
    }
}

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
    const pid = event.target.parentNode.dataset.id
    const profile = await getProfile(pid)
    // const stats = calStats(profile)
    tooltip.innerHTML = ''
    const span = document.createElement('span')
    span.style.width = '100%'
    span.style.display = 'inline-block'
    const span1 = span.cloneNode(true)
    span1.textContent = `(${profile.level}) ${profile.username}`
    tooltip.appendChild(span1)
    const span2 = span.cloneNode(true)
    span2.textContent = `Rating: ${profile.stats.rating} - ${profile.stats.wl_percent}%`
    if (profile.rating < 200) {
        span2.style.color = '#EE4B2B'
    } else {
        span2.style.color = '#50C878'
    }
    tooltip.appendChild(span2)
    const span3 = span.cloneNode(true)
    span3.textContent = `W/L: ${profile.stats.won} / ${profile.stats.lost}`
    if (profile.stats.wl_percent < 45) {
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

    const pid = element.dataset.id
    // console.debug('pid', pid)
    const profile = await getProfile(pid)
    // const stats = calStats(profile)
    const div = document.createElement('div')
    div.style.position = 'absolute'
    div.style.marginTop = '-3px'
    div.style.textAlign = 'center'
    div.style.width = '40px'
    div.style.fontSize = '16px'
    div.style.pointerEvents = 'none'
    div.classList.add('mouseover-stats')

    const spanRating = document.createElement('span')
    const { options } = await chrome.storage.sync.get(['options'])
    if (options.radioTopTip === 'tipTopLevel') {
        spanRating.textContent = profile.level
    } else {
        spanRating.textContent = profile.rating
    }
    spanRating.style.width = '100%'
    // spanRating.style.margin = '-5px 0'
    spanRating.style.display = 'inline-block'
    // spanRating.style.position = 'fixed'

    if (options.radioTopTip === 'tipTopLevel') {
        if (profile.level < 50) {
            spanRating.style.color = '#EE4B2B'
        } else {
            spanRating.style.color = '#50C878'
        }
    } else {
        if (profile.rating < 200) {
            spanRating.style.color = '#EE4B2B'
        } else {
            spanRating.style.color = '#50C878'
        }
    }

    spanRating.style.textShadow =
        '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
    div.appendChild(spanRating)

    // const br = document.createElement('br')
    // br.style.margin = '-5px 0'
    // div.appendChild(br)

    const spanRate = document.createElement('span')
    spanRate.textContent = `${profile.stats.wl_percent}%`
    spanRate.style.width = '100%'
    // spanRate.style.margin = '-5px 0'
    spanRate.style.display = 'inline-block'
    // spanRate.style.position = 'fixed'

    if (profile.stats.wl_percent < 45) {
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
 * @param {string} pid
 */
async function sendStatsChat(pid) {
    const aside = document.querySelector('aside')
    const sent = aside.querySelector(`#userid-${pid}`)
    if (sent) {
        console.debug('already sent stats for pid:', pid)
        return
    }
    const div = document.createElement('div')
    div.style.display = 'none'
    div.id = `userid-${pid}`
    aside.appendChild(div)
    await sendPlayerStats(pid)
}

/**
 * Send Player Stats to Chat
 * @function sendPlayerStats
 * @param {string} pid
 */
async function sendPlayerStats(pid) {
    const profile = await getProfile(pid)
    await sendChatMessage(profile.stats.text)
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
        if (history.length > 1) {
            history.back()
        } else {
            window.close()
            // window.location.href = window.location.origin
        }
    }
}

/**
 * TODO: Make this an Interval that cancels once complete
 * Set User Profile Timeout - 3000
 * @function setUserProfile
 */
async function setUserProfile() {
    // console.debug('setUserProfile interval')
    const { profile } = await chrome.storage.sync.get(['profile'])
    if (profile && Object.keys(profile).length) {
        clearInterval(userIntervalID)
        console.debug('User Profile Exist: clearInterval:', userIntervalID)
        return
    }

    // const pid = document.querySelector('div[data-id]')?.dataset.id
    const pid = document.querySelector('div[data-id][aria-haspopup="true"]')
        ?.dataset.id
    if (!pid) {
        console.log('User pid Not Found:', pid)
        return
    }
    console.info('User Profile Set to pid:', pid)
    const player = await getProfile(pid)
    await updateUserProfile(player)
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
 * @param {String} pid Player ID
 * @param {Boolean} skip Skip Expire Check
 * @returns {Object}
 */
async function getProfile(pid, skip) {
    if (profilesCache[pid]) {
        if (skip) {
            return profilesCache[pid]
        }
        const age =
            Math.floor(Date.now() / 1000) - profilesCache[pid].ts_updated
        if (age < 150) {
            // console.debug('using cached profile, age:', age)
            return profilesCache[pid]
        }
        // console.debug('cached profile expired, age:', age)
    }
    const profileUrl = `https://api-v2.playdrift.com/api/profile/trpc/profile.get?input=%7B%22id%22%3A%22${pid}%22%2C%22game%22%3A%22dominoes%22%7D`
    // console.debug('profileUrl:', profileUrl)
    const response = await fetch(profileUrl)
    const data = await response.json()
    const profile = structuredClone(data.result.data)
    profile.ts_updated = Math.floor(Date.now() / 1000)
    profile.stats = calStats(profile)
    profilesCache[pid] = profile
    console.info('profile:', profile)
    return profile
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
    const text = `${profile.username} (${rating}) W/L: ${games_won.toLocaleString()} / ${games_lost.toLocaleString()} (${wl_percent}%)`
    return {
        rating,
        games_won,
        games_lost,
        wl_percent,
        text,
        won: games_won.toLocaleString(),
        lost: games_lost.toLocaleString(),
    }
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
    const historyMax = 50
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
        last.games_won + last.games_lost <
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
 * Button Continue Handler
 * @function buttonContinue
 * @param {HTMLButtonElement} el
 */
async function buttonContinue(el) {
    const { options } = await chrome.storage.sync.get(['options'])
    // console.debug('buttonContinue:', el, options)
    if (el && options.autoContinueGameEnd) {
        // console.debug('clicking:', el)
        el.click()
    }
}

/**
 * Update Profile Dialog
 * @function updateProfile
 */
async function updateProfile() {
    // console.debug('updateProfile:', container)
    const url = new URL(window.location)
    const pid = url.searchParams.get('profile')
    const profile = await getProfile(pid)
    const { banned } = await chrome.storage.sync.get(['banned'])

    const container = document.querySelector('.MuiDialog-container')
    container?.addEventListener('click', profileCloseClick)
    const parent = container.querySelectorAll('.MuiBox-root')[1]
    const root = container.querySelectorAll('.MuiBox-root')[4]

    if (parent.dataset.processed) {
        return console.debug('already processed parent:', parent)
    }
    parent.dataset.processed = 'yes'

    // const name = container.querySelector('.MuiBox-root h5')
    // const name = parent.querySelector('h5')

    console.debug('updateProfile:', pid, profile, container, root)

    // const h5 = name.cloneNode(true)
    const h5 = document.createElement('h6')
    h5.classList.add('MuiTypography-root', 'MuiTypography-h6')
    h5.textContent = profile.id
    // h5.style.color = '#314157'
    // h5.style.color = 'rgba(255, 255, 255, 0.7)'
    h5.style.margin = '0'
    parent.insertBefore(h5, parent.children[3])

    // const root = container?.querySelector('h2')?.nextSibling
    // const parent = root?.querySelector('h5')?.nextSibling?.nextSibling

    // console.debug('parent:', parent)
    // if (!parent) {
    //     return console.warn('parent not found', container, root, parent)
    // }

    root.style.marginTop = 0
    root.style.marginBottom = '10px'

    const divText = document.createElement('div')
    divText.style.textAlign = 'center'

    const spanStats = document.createElement('span')
    spanStats.id = 'stats-text'
    spanStats.textContent = profile.stats.text
    spanStats.hidden = true
    divText.appendChild(spanStats)

    const spanRating = document.createElement('span')
    spanRating.style.color = profile.stats.rating < 200 ? '#EE4B2B' : '#50C878'
    spanRating.textContent = ` Rating: ${profile.stats.rating} `
    divText.appendChild(spanRating)

    const spanGames = document.createElement('span')
    spanGames.style.color =
        profile.stats.wl_percent < 45 ? '#EE4B2B' : '#50C878'
    // spanGames.id = 'profile.stats-text'
    spanGames.textContent = ` W/L: ${profile.stats.won} / ${profile.stats.lost} (${profile.stats.wl_percent}%) `
    divText.appendChild(spanGames)

    root.appendChild(divText)
    const divBtns = document.createElement('div')
    divBtns.style.textAlign = 'center'

    const button = document.createElement('button')
    button.style.margin = '0 2px 0 2px'

    const copyButton = button.cloneNode(true)
    copyButton.addEventListener('click', copyClick)
    copyButton.textContent = 'Copy'
    copyButton.style.marginRight = '20px'
    divBtns.appendChild(copyButton)

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

    const kickButton = button.cloneNode(true)
    kickButton.addEventListener('click', kickClick)
    kickButton.textContent = 'Kick'
    divBtns.appendChild(kickButton)

    // const sendKickButton = button.cloneNode(true)
    // sendKickButton.addEventListener('click', sendKickClick)
    // sendKickButton.textContent = 'Kick/Send'
    // divBtns.appendChild(sendKickButton)

    const sendButton = button.cloneNode(true)
    sendButton.addEventListener('click', sendClick)
    sendButton.textContent = 'Send'
    sendButton.style.marginLeft = '20px'
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

// /**
//  * Send Chat and Kick Click Callback
//  * @function sendKickClick
//  * @param {MouseEvent} event
//  */
// async function sendKickClick(event) {
//     const pid = document.getElementById('profile-id').value
//     console.debug('sendKickClick:', pid, event)
//     await kickPlayer(pid)
//     const player = await getProfile(pid)
//     await sendChatMessage(`Kicked Player: ${player.username}`)
// }

/**
 * Kick Click Callback
 * @function kickClick
 * @param {MouseEvent} event
 */
async function kickClick(event) {
    const pid = document.getElementById('profile-id').value
    console.debug('kickClick:', pid, event)
    await kickPlayer(pid)
    history.back()
}

/**
 * Ban Click Callback
 * @function banClick
 * @param {MouseEvent} event
 */
async function banClick(event) {
    const pid = document.getElementById('profile-id').value
    const { banned, options } = await chrome.storage.sync.get([
        'banned',
        'options',
    ])
    console.debug('banClick:', pid, banned, event)
    if (!banned.includes(pid)) {
        banned.push(pid)
        await chrome.storage.sync.set({ banned })
    }
    const player = await getProfile(pid)
    await sendChatMessage(`Banned User: ${player.username}`)
    if (options.autoKickBanned) {
        await kickPlayer(pid)
    }
    history.back()
}

/**
 * Unban Click Callback
 * @function unbanClick
 * @param {MouseEvent} event
 */
async function unbanClick(event) {
    const pid = document.getElementById('profile-id').value
    const { banned } = await chrome.storage.sync.get(['banned'])
    console.debug('banClick:', pid, banned, event)
    const index = banned.indexOf(pid)
    if (index !== undefined) {
        banned.splice(index, 1)
        await chrome.storage.sync.set({ banned })
    }
    backOrClose()
}

function backOrClose() {
    if (history.length > 1) {
        history.back()
    } else {
        window.close()
    }
}

/**
 * Kick a Player by ID
 * @function kickPlayer
 * @param {string} pid
 */
async function kickPlayer(pid) {
    console.debug('kickPlayer:', pid)
    const { profile } = await chrome.storage.sync.get(['profile'])
    const room = roomState[currentRoom]
    const owner = room?.players.length && room.players[0] === profile.id
    if (!owner || room.kicked.includes(pid)) {
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
        body: JSON.stringify({ player: pid }),
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
    const tid = roomState[currentRoom]?.tid
    console.debug('sendChatMessage:', currentRoom, tid, message)
    if (!message) {
        return console.debug('no message provided')
    }
    message = `Auto: ${message}`
    if (!tid) {
        return sendChatMessageLegacy(message)
    }
    const url = `https://api-v2.playdrift.com/api/v1/chat/${tid}/send`
    console.debug('url:', url)
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

/**
 * Select Team for Room
 * @function selectTeam
 * @param {String} rid Room ID
 * @param {String} team Team Number
 */
async function selectTeam(rid, team) {
    console.debug('selectTeam:', rid, team)
    const body = {
        operationName: 'RoomTeamSelect',
        variables: { id: rid, gtype: 'dominoes#v3', team: team.toString() },
        query: 'mutation RoomTeamSelect($id: ID!, $gtype: String!, $team: String!) {\n  roomTeamSelect(id: $id, gtype: $gtype, team: $team)\n}',
    }
    const init = {
        credentials: 'include',
        headers: {
            Accept: '*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        method: 'POST',
        mode: 'cors',
    }
    const response = await fetch('https://api-v2.playdrift.com/graphql', init)
    console.debug('response:', response)
}

/**
 * Compare Two Arrays for Equality
 * @function cmpArrays
 * @param {Array} arr1 Array 1
 * @param {Array} arr2 Array 2
 * @return {Boolean}
 */
function cmpArrays(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return true
    }
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return true
        }
    }
    return false
}

/**
 * Compare Two Objects for Equality
 * @function cmpObjects
 * @param {Object} obj1 Object 1
 * @param {Object} obj2 Object 2
 * @return {Boolean}
 */
function cmpObjects(obj1, obj2) {
    if (Object.keys(obj1).length !== Object.keys(obj2).length) {
        return true
    }
    for (const [key, value] of Object.entries(obj1)) {
        if (obj2[key] !== value) {
            return true
        }
    }
    return false
}
