const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

const sourceDir = 'src'
const screenshotsDir = 'tests/screenshots'

/** @type {import('puppeteer').Browser}*/
let browser
/** @type {import('puppeteer').Page}*/
let page

let count = 1

/**
 * @function screenshot
 * @param {String} name
 * @return {Promise<void>}
 */
async function screenshot(name) {
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir)
    }
    const n = count.toString().padStart(2, '0')
    await page.screenshot({ path: `${screenshotsDir}/${n}_${name}.png` })
    count++
}

/**
 * @function getPage
 * @param {String} name
 * @param {Boolean=} log
 * @param {String=} size
 * @return {import('puppeteer').Page}
 */
async function getPage(name, log, size) {
    console.debug(`getPage: ${name}`, log, size)
    const target = await browser.waitForTarget(
        (target) => target.type() === 'page' && target.url().endsWith(name)
    )
    page = await target.asPage()
    await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: 'dark' },
    ])
    if (size) {
        const [width, height] = size.split('x').map((x) => parseInt(x))
        await page.setViewport({ width, height })
    }
    if (log) {
        console.debug(`Adding Logger: ${name}`)
        page.on('console', (msg) =>
            console.log(`console: ${name}:`, msg.text())
        )
    }
    return page
}

;(async () => {
    const pathToExtension = path.join(process.cwd(), sourceDir)
    console.log('pathToExtension:', pathToExtension)
    browser = await puppeteer.launch({
        args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`,
        ],
        dumpio: true,
        // headless: false,
        // slowMo: 150,
    })
    console.log('browser:', browser)

    // Get Service Worker
    const workerTarget = await browser.waitForTarget(
        (target) =>
            target.type() === 'service_worker' &&
            target.url().endsWith('service-worker.js')
    )
    const worker = await workerTarget.worker()
    console.log('worker:', worker)

    // Popup
    await worker.evaluate('chrome.action.openPopup();')
    page = await getPage('popup.html')
    console.log('page:', page)
    await page.waitForNetworkIdle()
    await screenshot('popup')
    await page.locator('[href="../html/options.html"]').click()

    // Options
    // await worker.evaluate('chrome.runtime.openOptionsPage();')
    page = await getPage('options.html')
    console.log('page:', page)
    await page.waitForNetworkIdle()
    await screenshot('options')
    await page.evaluate(() => {
        window.scrollBy({
            top: window.innerHeight,
            left: 0,
            behavior: 'instant',
        })
    })
    await screenshot('options')
    await page.close()

    // Log in to PlayDrift and continue testing...

    await browser.close()
})()
