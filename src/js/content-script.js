// JS Content Script

// ;(async () => {
//     // const { options } = await chrome.storage.sync.get(['options'])
//     // console.log('options:', options)
//     // const message = { message: 'test' }
//     // console.log('message:', message)
//     // const response = await chrome.runtime.sendMessage(message)
//     // console.log('response:', response)
// })()

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.debug('message:', message)
    if (!message.url) {
        return console.warn('No message.url')
    }
    let url = new URL(message.url)
    if (url.search.includes('?profile=')) {
        let profile = url.searchParams.get('profile')
        console.debug(`Process Profile: ${profile}`)
        ;(async () => {
            const url = `https://api-v2.playdrift.com/api/profile/trpc/profile.get?input=%7B%22id%22%3A%22${profile}%22%2C%22game%22%3A%22dominoes%22%7D`
            const response = await fetch(url)
            const data = await response.json()
            console.info('profile data:', data)

            let div = document.createElement('div')
            // div.classList.add(
            //     'MuiChip-root',
            //     'MuiChip-outlined',
            //     'MuiChip-sizeMedium',
            //     'MuiChip-colorDefault',
            //     'MuiChip-outlinedDefault'
            // )
            let span = document.createElement('span')
            span.style.color =
                parseInt(data.result.data.games_won) <
                    parseInt(data.result.data.games_lost) ||
                parseInt(data.result.data.rating) < 150
                    ? 'red'
                    : 'green'
            // span.style.color = 'red'
            span.id = 'stats-text'
            // span.classList.add('MuiChip-label', 'MuiChip-labelMedium')
            span.textContent = `Rating: ${data.result.data.rating} - W/L: ${data.result.data.games_won} / ${data.result.data.games_lost}`
            div.appendChild(span)
            let root = document
                .querySelector('.MuiDialogContent-root')
                .querySelectorAll('.MuiBox-root')[3]
            root.appendChild(div)
            // let textData = `${data.result.data.username} - ${span.textContent}`
            // navigator.clipboard.writeText(textData).then()

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

            let username = document.createElement('span')
            username.id = 'profile-username'
            username.textContent = data.result.data.username
            username.hidden = true
            root.appendChild(username)
        })()
    }
    // if (url.pathname.includes('/room/')) {
    //     let room = url.pathname.split('/')[2]
    //     console.debug(`Process Room: ${room}`)
    // }
})

function copyClick(event) {
    let username = document.getElementById('profile-username').textContent
    let text = document.getElementById('stats-text').textContent
    let data = `${username} - ${text}`
    console.log(`copied text: ${data}`)
    navigator.clipboard.writeText(data).then()
    // history.back()
}

function sendClick(event) {
    let username = document.getElementById('profile-username').textContent
    let text = document.getElementById('stats-text').textContent
    let data = `${username} - ${text}`
    console.log(`sending text: ${data}`)
    let textarea = document.querySelectorAll('textarea[aria-invalid="false"]')
    if (textarea.length > 1) {
        textarea[1].value = data
        document.querySelector('button[aria-label="send message"]')?.click()
    }
    history.back()
}
