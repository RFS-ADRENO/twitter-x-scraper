import TelegramBot from "node-telegram-bot-api";
import { TwitterScraper } from "./scripts/scrape.js";
import { publish } from "./scripts/publish.js";
import fs from "fs";

import getPAGEID from "./scripts/getPageID.js";

const wid = process.env.WHITELIST_CHAT_ID;
const bot = new TelegramBot(process.env.TELEGRAMBOT_TOKEN, { polling: true });

const ADMIN_IDS = process.env.ADMIN_IDS.split(",");

console.log("Bot started");

let started = false;

const JOB_TYPE = {
    TOP: "top",
    LATEST: "latest",
};

const JOB_STATUS = {
    PENDING: "pending",
    ACTIVE: "active",
    DONE: "done",
};

const jobs = [];
const pageTokens = [];

console.log();
console.log("Loading page tokens...");
console.log();
for (const key in process.env) {
    if (key.startsWith("FBTOKEN_") && key.length > 8) {
        const token = process.env[key];
        const tokenName = key.slice(8);

        if (!token) {
            console.warn(`[ WARN ] ${tokenName} has an invalid token!`);
        }

        pageTokens.push({
            tokenName,
            token,
            id: !token ? null : await getPAGEID(token, tokenName).catch(e => {
                console.log("[ ERROR ] Failed to get pageID for", tokenName);
                console.log(e.response.data);
                return null;
            }),
        });
    }
}

console.log();

const processData = (pageToken) => {
    return async (data) => {
        await bot.sendMessage(wid, `Received ${data.length} tweets`);
				// Send tweets info to Telegram group
        // for (const each of data) {
        //     const { content, origin, imgLocalPath } = each;
        //     const caption = `${content}\n\n${origin}`;

        //     if (imgLocalPath.length > 1) {
        //         await bot.sendMediaGroup(
        //             wid,
        //             imgLocalPath.map((e, i) => {
        //                 return {
        //                     type: "photo",
        //                     media: fs.createReadStream(e),
        //                     caption: i == 0 ? caption : undefined,
        //                 };
        //             })
        //         );
        //     } else {
        //         await bot.sendPhoto(wid, fs.createReadStream(imgLocalPath[0]), {
        //             caption,
        //         });
        //     }

        //     await new Promise((resolve) => setTimeout(resolve, 2000));
        // }

        await bot.sendMessage(wid, "Publishing...");
        await publish(data, bot, wid, pageToken);
        await bot.sendMessage(wid, "Done");
    };
};

/**
 *
 * @param {string} text
 * @param {"top" | "latest"} type
 * @param {string} pageID
 * @returns
 */
const scrape = async (text, type, pageID) => {
    return new Promise(async (resolve, reject) => {
        if (started) {
            bot.sendMessage(wid, "Already started");
            return;
        }

        started = true;
        try {
            await bot.sendMessage(wid, "Scraping...");
            const args = text.split(/\s+/);

            const scraper = new TwitterScraper(
                args,
                process.env.TWITTER_COOKIE,
                pageID
            );

            scraper.run(type);
            scraper.on("data", resolve);
            scraper.on("close", () => {
                started = false;

                resolve(null);
            });

            scraper.on("error", (e) => {
                console.error(e);
                started = false;

                reject();
            });
        } catch (e) {
            console.error(e);
            started = false;
        }
    });
};

// @TODO: Do something to stop the scraper without killing the process
bot.onText(/\/stop/, async (msg) => {
    if (wid != msg.chat.id) return;

    if (!started) {
        await bot.sendMessage(wid, "Not started");
        return;
    }

    await bot.sendMessage(wid, "Stopping...");
    process.exit(0);
});

bot.onText(/\/uid/, async (msg) => {
		if (wid != msg.chat.id) return;

		await bot.sendMessage(wid, msg.from.id);
});

function processStartCommandData(msg, type) {
    if (wid != msg.chat.id) return;
		if (!ADMIN_IDS.includes(msg.from.id.toString())) return;

    const args = msg.text.split(/\s+/).slice(1);

    const ctx = args.join(" ").split("|");
    const assignedTo = ctx[0]?.trim() ?? "";
    const content = ctx[1]?.trim() ?? "";

    if (assignedTo.length == 0 || content.length == 0) {
        return bot.sendMessage(
            wid,
            "Invalid context, must be:\n /startTop pageNumber | hashtag1 hashtag2"
        );
    }

    const parsedAssignedTo = parseInt(assignedTo);
    if (isNaN(parsedAssignedTo))
        return bot.sendMessage(
            wid,
            "Invalid page number, use /pages to see all pages"
        );
    if (parsedAssignedTo < 1 || parsedAssignedTo > pageTokens.length) {
        return bot.sendMessage(
            wid,
            "Invalid page number, use /pages to see all pages"
        );
    }

    const index = parsedAssignedTo - 1;
    const pageToken = pageTokens[index];

    if (!pageToken.token)
        return bot.sendMessage(
            wid,
            "Page is inactive, use /pages to see all active pages"
        );

    jobs.push({
        status: JOB_STATUS.PENDING,
        text: content,
        type: type,
        pageToken: pageToken.token,
				pageTokenName: pageToken.tokenName,
        pageID: pageToken.id,
    });

    return bot.sendMessage(
        wid,
        "" +
            `JOB "${content}" (${type}) added to queue\n` +
            `Page: ${pageToken.tokenName} (${index + 1})\n` +
            `Total jobs in queue: ${jobs.length}`
    );
}

bot.onText(/\/startTop (.*)/, async (msg) => {
    processStartCommandData(msg, JOB_TYPE.TOP);
});

bot.onText(/\/startLatest (.*)/, async (msg) => {
    processStartCommandData(msg, JOB_TYPE.LATEST);
});

bot.onText(/\/pages/, async (msg) => {
    if (wid != msg.chat.id) return;

    await bot.sendMessage(
        wid,
        "=== PAGES ===\n" +
            pageTokens
                .map((e, i) => {
                    return `${i + 1}.  [${!e.token ? "    " : " * "}]  ${
                        e.tokenName
                    } (${e.id})`;
                })
                .join("\n")
    );
});

const TIMEOUT = 3000; // 3 seconds

async function timeFunc() {
    if (jobs.length == 0) return setTimeout(timeFunc, TIMEOUT);

    const job = jobs[0];
    if (job.status == JOB_STATUS.ACTIVE) return;

    console.log(`[ JOB ] Starting job "${job.text}" (${job.type})`);
		const index = pageTokens.findIndex((e) => e.token == job.pageToken);
		await bot.sendMessage(wid, `Page: ${job.pageTokenName} (${index + 1})\nStarting job "${job.text}" (${job.type})`);

    job.status = JOB_STATUS.ACTIVE;

    try {
        const data = await scrape(job.text, job.type, job.pageID);
        if (!data) throw new Error("This should not happen");
        await processData(job.pageToken)(data);
    } catch {
        await bot.sendMessage(wid, `JOB "${job.text}" failed`);
    }

    jobs.shift();

    setTimeout(timeFunc, TIMEOUT);
}
setTimeout(timeFunc, TIMEOUT);
