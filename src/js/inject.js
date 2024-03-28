// JS Execute Script inject.js

// Only add one listener for multiple injections
if (!window.injected) {
    window.injected = true
    chrome.runtime.onMessage.addListener(onMessage)
    setTimeout(function () {
        alert('Script inject.js injected.')
    }, 1)
} else {
    setTimeout(function () {
        alert('Script inject.js already injected!')
    }, 1)
}

// Run some good code
console.log('Injected: inject.js')

// Use function from content-script.js
// console.log(contentScriptFunction())

/**
 * Handle Messages
 * @function onMessage
 * @param {String} message
 * @param {MessageSender} sender
 * @param {Function} sendResponse
 */
function onMessage(message, sender, sendResponse) {
    console.log(`onMessage: message: ${message}`)
}
