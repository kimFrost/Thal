
const fs = require('fs');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const request = require('request');

async function run() {

    const width = 1280;
    const height = 800;
    const baseUrl = 'http://edu.local.corp.lego.com';

    const browser = await puppeteer.launch({
        headless: true
    });

    const page = await browser.newPage();

    await page.setViewport({ width, height })

    //await page.goto('http://edu.local.corp.lego.com/en-us/lessons?pagesize=12');
    await page.goto(baseUrl);



    //let html = await page.evaluate(() => document.body.innerHTML);
    const html = await page.content();
    
    //fs.writeFile('build/content.html', html, _ => console.log('done'));

    const $ = cheerio.load(html);


    let pageVisited = {};
    //pageVisited[url] = true;
    let links = [];

    $('a[href]').filter(function(){
        var data = $(this);
        var href = data.attr('href');
        if (!links.includes(href)) {
            links.push(href); 
        }
    })

    links = links.filter((link) => link.charAt(0) === '/');


    // Loop links
      // Navigate to link
        // Scrape page for links
          // Add new links to links

    /*
    links.forEach(async (link)=>{
        await page.goto(baseUrl + link);
    });
    */

    console.log(links);


    await page.screenshot({ path: 'screenshots/lego.png', fullPage: true });

    browser.close();
}

async function scrapePage(url) {

    //return links in page
}

/*
let navigateTo = async () => {
    await page.goto(url);
}
*/
async function navigateTo(url) {
    await page.goto(url);
}
/*
navigateTo('test').then(() => {

});
*/

run();



//https://medium.com/@e_mad_ehsan/getting-started-with-puppeteer-and-chrome-headless-for-web-scrapping-6bf5979dee3e
//https://codeburst.io/a-guide-to-automating-scraping-the-web-with-javascript-chrome-puppeteer-node-js-b18efb9e9921
//https://blog.lovemily.me/a-deep-dive-guide-for-crawling-spa-with-puppeteer-and-troubleshooting/

//https://github.com/gajus/surgeon