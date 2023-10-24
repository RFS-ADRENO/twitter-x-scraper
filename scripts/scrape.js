import puppeteer, { Page } from "puppeteer";
import { add, save } from "./db.js";
import { EventEmitter } from "events";

export class TwitterScraper extends EventEmitter {
    constructor(tags, cookieStr) {
        super();
        if (tags.length === 0) {
            console.error("Please provide a tag");
            process.exit(1);
        }

        if (!cookieStr) {
            console.error("Please provide a cookie string");
            process.exit(1);
        }

        this.browser = null;
        this.cookies = cookieStr
            .split(";")
            .filter((c) => c)
            .map((pair) => {
                const name = pair.split("=")[0].trim();
                const value = pair.split("=")[1].trim();
                return { name, value, domain: ".twitter.com" };
            });
        this.tags = tags;
        this.tagsStr = encodeURIComponent(
            tags.map((tag) => `#${tag}`).join(" ")
        );
    }

    async run() {
        try {
            this.browser = await puppeteer.launch({
                headless: process.env.NODE_ENV === "production",
                defaultViewport: null,
                args: [
                    "--disable-notifications",
                    "--disable-geolocation",
                    "--disable-audio-output",
                    "--disable-web-security",
                    "--disable-features=IsolateOrigins,site-per-process",
                ],
            });

            const page = await this.browser.newPage();
            await page.setViewport({ width: 600, height: 800 });
            await page.setCookie(...this.cookies);

            await page.goto(
                `https://twitter.com/search?q=${this.tagsStr}&src=typed_query&f=live`,
                {
                    waitUntil: "networkidle2",
                }
            );

            await page.waitForSelector(`article[data-testid="tweet"]`, {
                timeout: 10000,
            });

            await this.wait(1000);

            let time = 2;

            const tweets = [];

            while (time--) {
                const retrievedTweets = await this.getTweetsData(page);
                for (const tweet of retrievedTweets) {
                    let isValidTweet = true;

                    for (const tag of this.tags) {
                        if (!tweet.content.toLowerCase().includes(`#${tag.toLowerCase()}`)) {
                            console.log(
                                `Tweet ${tweet.origin} does not contain tag ${tag}`
                            );
                            isValidTweet = false;
                            break;
                        }
                    }

                    if (!isValidTweet) continue;

                    tweets.push(tweet);
                }
            }

            const appendData = await add(tweets);
            save();

            this.emit("data", appendData);

            console.log(`Total tweets: ${tweets.length}`);
        } catch (error) {
            this.emit("error", error);
        } finally {
            await this.close();
        }
    }

    /**
     *
     * @param {Page} page
     */
    async getTweetsData(page) {
        return await page.evaluate(async () => {
            const tweets = [];

            window.scrollBy(0, 1280);
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const tweetElements = document.querySelectorAll(
                'article[data-testid="tweet"]'
            );
            for (const tweetElement of tweetElements) {
                const tweet = {};

                tweet.origin =
                    tweetElement.querySelectorAll('a[href^="/"]')?.[3]?.href;
                if (!tweet.origin) continue;

                const tweetTitle = tweetElement.querySelector(
                    'div[data-testid="tweetText"]'
                );
                tweet.content = tweetTitle.textContent;

                const tweetPhotos = tweetElement.querySelectorAll(
                    'div[data-testid="tweetPhoto"]'
                );

                if (tweetPhotos.length == 0) continue;

                tweet.imageSrc = [];
                for (const tweetPhoto of tweetPhotos) {
                    const imgSrc = tweetPhoto?.querySelector("img")?.src;

                    if (imgSrc) {
                        tweet.imageSrc.push(imgSrc);
                    }
                }

                if (!tweet.content) continue;

                if (tweets.some((t) => t.origin == tweet.origin)) continue;

                tweets.push(tweet);
            }

            return tweets;
        });
    }

    async wait(delay) {
        await new Promise((resolve) => setTimeout(resolve, delay));
    }

    async close() {
        if (this.browser) await this.browser.close();

        this.emit("close");
    }
}
