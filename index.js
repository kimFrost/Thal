//import { EventEmitter } from 'events';
const EventEmitter = require('events');

const fs = require('fs');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const request = require('request');
const rp = require('request-promise');
const pixelmatch = require('pixelmatch');
const PNG = require('pngjs').PNG;
const filenamify = require('filenamify');


const width = 1280;
const height = 800;
const baseUrl = 'https://education.webqa.lego.com/en-us';
const maxNumOfTabs = 3;
let pages = [];
let idlePages = [];
var visitedUrls = [];
var toVisitUrls = [baseUrl];


class PageWrapper extends EventEmitter {
    constructor(page) {
        super();
        this.page = page;
    }

    goto(url) {
        if (this.page) {
            this.page.goto(url, {
                timeout: 120000
            }).then(() => {
                this.OnIdle();
            });
        }
    }

    OnIdle() {
        const event = {page: this.page};
        this.emit('OnIdle', event);
    }
}


async function run() {

    const browser = await puppeteer.launch({
        headless: false
    });

    /*
    for (let i = 0; i < maxNumOfTabs; i++) {
        const page = await browser.newPage();
        await page.setViewport({ width, height });
        //page.on('domcontentloaded', pageLoaded);
        const pageWrapper = new PageWrapper(page);
        pageWrapper.on('OnIdle', pageIdle);
        pages.push(pageWrapper);
    }
    for (const page of pages) {
        //pushIdlePage(page);
        if (page && toVisitUrls.length > 0) 
        {
            page.goto(toVisitUrls.shift());
        }
    }
    */
    

    
    const page = await browser.newPage();
    await page.setViewport({ width, height })
    const html = await page.content();
    const $ = cheerio.load(html);

    //await compare(page);
    await crawl(page, baseUrl)
    

    const links = {
        'Home': 'http://edu.local.corp.lego.com',
        'Lessons': 'http://edu.local.corp.lego.com/en-us/lessons',
        'Downloads': 'http://edu.local.corp.lego.com/en-us/downloads',
        'DownloadsMindstorm': 'https://education.webqa.lego.com/en-us/lessons/maker-elementary/digital-accessory',
        'Preschool': 'http://edu.local.corp.lego.com/en-us/preschool/explore',
        'Middleschool': 'http://edu.local.corp.lego.com/en-us/middle-school/explore'
    };

    /*
    const links = {
        'Home': 'https://education.webqa.lego.com',
        'Downloads': 'https://education.webqa.lego.com/en-us/downloads',
        'DownloadsMindstormSoftware': 'https://education.webqa.lego.com/en-us/downloads/mindstorms-ev3/software',
        'DownloadsMindstormCurriculum': 'https://education.webqa.lego.com/en-us/downloads/mindstorms-ev3/curriculum',
        'MiddleSchool': 'https://education.webqa.lego.com/en-us/middle-school/intro',
        'Lessons': 'https://education.webqa.lego.com/en-us/lessons?pagesize=12',
        'LessonPage': 'https://education.webqa.lego.com/en-us/lessons/maker-elementary/digital-accessory'
    };
    */

    /*
    for (const key in links) {
        console.log('link: ' + links[key]);
        await navigateTo(page, key, links[key]);
    }
    */

    //await handleLinks(page, links);

    //browser.close();
}

function pageLoaded(event) {
    console.log('pageLoaded', event);
}

function pageIdle(page) {

}

async function pushIdlePage(page) {
    if (toVisitUrls.length) {
        CrawlLoadUrl(page, toVisitUrls.shift()).then((NewLinks) => {
            
        });
    }
    else {
        idlePages.push(page);
    }
}

/*
visitedUrls.push(link);
for (const newLink of NewLinks) {
    if (!toVisitUrls.includes(rootUrl + newLink)) {
        toVisitUrls.push(rootUrl + newLink);
    }
}
console.log('NumOfVisitedUrls: ' + visitedUrls.length + ' NumOftoVisitUrls: ' + toVisitUrls.length);
fs.writeFile('logs/links.json', JSON.stringify(toVisitUrls), () => { });
*/

async function crawl(page, rootUrl) {
    for (const link of toVisitUrls) {
        //maxNumOfTabs
        //var NewLinks = await CrawlLoadUrl(page, link);
        //var NewLinks = await CrawlUrl(link);

        await CrawlUrl(link).then((NewLinks)=> {
            visitedUrls.push(link);
            for (const newLink of NewLinks) {
                if (!toVisitUrls.includes(rootUrl + newLink)) {
                    toVisitUrls.push(rootUrl + newLink);
                }
            }
            console.log('NumOfVisitedUrls: ' + visitedUrls.length + ' NumOftoVisitUrls: ' + toVisitUrls.length);
            fs.writeFile('logs/links.json', JSON.stringify(toVisitUrls), () => { });
        });

    }
}

async function compare(page) {
    await page.goto('https://education.webqa.lego.com/en-us/lessons', {
        timeout: 120000
    });
    const heroStageEl = await page.$('body');
    const heroStageRes = await heroStageEl.screenshot({ path: 'screenshots/hero-spot.stage.png', type: 'png' });

    await page.goto('https://education.lego.com/en-us/lessons', {
        timeout: 120000
    });
    const heroLiveEl = await page.$('body');
    const heroLiveRes = await heroLiveEl.screenshot({ path: 'screenshots/hero-spot.live.png', type: 'png' });

    var img1 = fs.createReadStream('screenshots/hero-spot.stage.png').pipe(new PNG()).on('parsed', doneReading),
        img2 = fs.createReadStream('screenshots/hero-spot.live.png').pipe(new PNG()).on('parsed', doneReading),
        filesRead = 0;

    function doneReading() {
        if (++filesRead < 2) return;
        var diff = new PNG({ width: img1.width, height: img1.height });

        pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold: 0.1 });

        diff.pack().pipe(fs.createWriteStream('screenshots/diff.png'));
    }
}

async function handleLinks(page, links) {
    for (const link of links) {
        console.log('link: ' + link);
        await navigateTo(page, link);
    }
    /*
    await Promise.all(links.map(async (linknum) => {
        await navigateTo(page, link);
    }));
    */
    /*
    await links.forEach(async (link) => {
        await navigateTo(page, link);
    });
    */
}


async function navigateTo(page, title, url) {
    await page.goto(url, {
        timeout: 120000
    });
    await page.screenshot({ path: 'screenshots/' + title + '.png', fullPage: true });
    //page.screenshotArea
}

async function CrawlLoadUrl(page, url) {
    console.log('CrawlUrl: ' + url);

    let links = [];
    await page.goto(url, {
        timeout: 120000
    });
    //~~ Scraping ~~//
    console.log('Scraping: ' + url);

    const html = await page.content();
    var $ = cheerio.load(html);

    $('a[href]').filter(function () {
        var data = $(this);
        var href = data.attr('href');
        if (!links.includes(href)) {
            links.push(href);
        }
    })

    links = links.filter((link) => link.charAt(0) === '/');

    return links;
}

async function CrawlUrl(url) {
    let links = [];
    try {
        await rp({ url, resolveWithFullResponse: true })
            .then((response) => {
                fs.writeFile('logs/log.json', JSON.stringify(response), _ => console.log('done'));
                if (response.statusCode === 200) {
                    console.log('CrawlUrl: ' + url + ' ' + response.statusCode);
                    var $ = cheerio.load(response.body);
                    $('a[href]').filter(function () {
                        var data = $(this);
                        var href = data.attr('href');
                        if (!links.includes(href)) {
                            links.push(href);
                        }
                    })
                    links = links.filter((link) => link.charAt(0) === '/');
                }
                else {
                    console.log('URL ERROR: ' + url + ' ');
                    fs.writeFile('logs/' + filenamify(url) + '.json', JSON.stringify(response), _ => console.log('Write log'));
                }
            })
            .catch((err) => {
                console.log('REQUEST ERROR: ' + err);
                fs.writeFile('logs/' + filenamify(url) + '.json', JSON.stringify(err), _ => console.log('Write log'));
            });
    } catch (error) {
        console.log(error)
        //Promise.reject(error);
    }
    return links;
}

/*
async function screenshotDOMElement(selector, padding = 0) {
    const rect = await page.evaluate(selector => {
        const element = document.querySelector(selector);
        const { x, y, width, height } = element.getBoundingClientRect();
        return { left: x, top: y, width, height, id: element.id };
    }, selector);

    return await page.screenshot({
        path: 'element.png',
        clip: {
            x: rect.left - padding,
            y: rect.top - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2
        }
    });
}

await screenshotDOMElement('header aside', 16);
*/

/*
navigateTo('test').then(() => {

});
*/

run();



//https://medium.com/@e_mad_ehsan/getting-started-with-puppeteer-and-chrome-headless-for-web-scrapping-6bf5979dee3e
//https://codeburst.io/a-guide-to-automating-scraping-the-web-with-javascript-chrome-puppeteer-node-js-b18efb9e9921
//https://blog.lovemily.me/a-deep-dive-guide-for-crawling-spa-with-puppeteer-and-troubleshooting/

//https://github.com/gajus/surgeon