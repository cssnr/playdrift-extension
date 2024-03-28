// JS Content Script

// ;(async () => {
//     // const { options } = await chrome.storage.sync.get(['options'])
//     // console.log('options:', options)
//     // const message = { message: 'test' }
//     // console.log('message:', message)
//     // const response = await chrome.runtime.sendMessage(message)
//     // console.log('response:', response)
//     addListener()
// })()

// const observer = new MutationObserver(function () {
//     addListener()
// })
// observer.observe(document.body, {
//     attributes: true,
//     childList: true,
//     subTree: true,
// })

// function addListener() {
//     console.log('adding MuiAvatar-root event listener for click:')
//     document
//         .querySelectorAll('.MuiAvatar-root ')
//         .forEach((el) => el.addEventListener('click', clickAvatar))
// }
//
// function clickAvatar() {
//     console.log('clickAvatar')
// }

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log('message:', message)
    if (!message.url) {
        return
    }
    let url = new URL(message.url)
    if (url.search.includes('?profile=')) {
        let profile = url.searchParams.get('profile')
        console.log(`Process Profile: ${profile}`)
        ;(async () => {
            const url = `https://api-v2.playdrift.com/api/profile/trpc/profile.get?input=%7B%22id%22%3A%22${profile}%22%2C%22game%22%3A%22dominoes%22%7D`
            const response = await fetch(url)
            const data = await response.json()
            console.log('profile data:', data)
            // console.log(`rating: ${data.result.data.rating}`)

            let div = document.createElement('div')
            div.classList.add(
                'MuiChip-root',
                'MuiChip-outlined',
                'MuiChip-sizeMedium',
                'MuiChip-colorDefault',
                'MuiChip-outlinedDefault'
            )
            let span = document.createElement('span')
            span.id = 'stats-text'
            span.classList.add('MuiChip-label', 'MuiChip-labelMedium')
            span.textContent = `Rating: ${data.result.data.rating} - W/L: ${data.result.data.games_won} / ${data.result.data.games_lost}`
            div.appendChild(span)
            // console.log('div:', div)
            let copy = `${data.result.data.username} - ${span.textContent}`
            navigator.clipboard.writeText(copy).then()

            let root = document
                .querySelector('.MuiDialogContent-root')
                .querySelectorAll('.MuiBox-root')[3]
            // console.log('root:', root)
            root.appendChild(div)

            // let copy = document.createElement('button')
            // copy.addEventListener('click', copyButton)
            // copy.textContent = 'Copy'
            // root.appendChild(copy)

            // let send = document.createElement('button')
            // send.addEventListener('click', sendButton)
            // send.textContent = 'Send'
            // root.appendChild(send)

            // let username = document.createElement('span')
            // username.id = 'profile-username'
            // username.textContent = data.result.data.username
            // username.hidden = true
            // root.appendChild(username)
        })()
    }
    if (url.pathname.includes('/room/')) {
        let room = url.pathname.split('/')[2]
        console.log(`Process Room: ${room}`)
    }
})

function copyButton(event) {
    let username = document.getElementById('profile-username').textContent
    let text = document.getElementById('stats-text').textContent
    let data = `${username} - ${text}`
    console.log(`copied text: ${data}`)
    navigator.clipboard.writeText(data).then()
}

function sendButton(event) {
    let username = document.getElementById('profile-username').textContent
    let text = document.getElementById('stats-text').textContent
    let data = `${username} - ${text}`
    console.log(`sending text: ${data}`)
    let textarea = document.getElementById(':re:')
    textarea.value = data
    let button = document.querySelector('button[aria-label="send message"]')
    button.click()
}

// chrome.runtime.onMessage.addListener(onMessage)
// /**
//  * Handle Messages
//  * @function onMessage
//  * @param {String} message
//  * @param {MessageSender} sender
//  * @param {Function} sendResponse
//  */
// function onMessage(message, sender, sendResponse) {
//     console.log(`onMessage: message: ${message}`)
// }

// /**
//  * contentScriptFunction
//  * @return {string}
//  */
// function contentScriptFunction() {
//     return 'Hello from content-script.js'
// }

// console.log('adding fetch event listener')
// window.addEventListener('fetch', event => console.log('fetch'));

// var currentTab;
// var version = "1.0";
//
// chrome.tabs.query( //get current Tab
//     {
//         currentWindow: true,
//         active: true
//     },
//     function(tabArray) {
//         currentTab = tabArray[0];
//         chrome.debugger.attach({ //debug at current tab
//             tabId: currentTab.id
//         }, version, onAttach.bind(null, currentTab.id));
//     }
// )
//
//
// function onAttach(tabId) {
//
//     chrome.debugger.sendCommand({ //first enable the Network
//         tabId: tabId
//     }, "Network.enable");
//
//     chrome.debugger.onEvent.addListener(allEventHandler);
//
// }
//
//
// function allEventHandler(debuggeeId, message, params) {
//
//     if (currentTab.id !== debuggeeId.tabId) {
//         return;
//     }
//
//     if (message === "Network.responseReceived") { //response return
//         chrome.debugger.sendCommand({
//             tabId: debuggeeId.tabId
//         }, "Network.getResponseBody", {
//             "requestId": params.requestId
//         }, function(response) {
//             // you get the response body here!
//             // you can close the debugger tips by:
//             chrome.debugger.detach(debuggeeId);
//         });
//     }
//
// }
