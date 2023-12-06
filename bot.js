import TelegramBot from "node-telegram-bot-api";
import { TwitterScraper } from "./scripts/scrape.js";
import { publish } from "./scripts/publish.js";
import fs from "fs";

const wid = process.env.whitelist_chat_id;
const bot = new TelegramBot(process.env.token, { polling: true });
console.log("Bot started");

let started = false;

const callback = async (data) => {
    console.log("DATA RECEIVED");
    await bot.sendMessage(wid, `Received ${data.length} tweets`);
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
    await publish(data, bot, wid);
    await bot.sendMessage(wid, "Done");
};

/**
 * 
 * @param {string} text 
 * @param {"top" | "latest"} type 
 * @returns 
 */
const scrape = async (text, type) => {
    if (started) {
        bot.sendMessage(wid, "Already started");
        return;
    }

    started = true;
    try {
        await bot.sendMessage(wid, "Scraping...");
        const args = text
            .split(" ")
            .slice(1)
            .filter((e) => e);

        const scraper = new TwitterScraper(args, process.env.cookie);

        scraper.run(type);
        scraper.on("data", callback);
        scraper.on("close", () => {
            started = false;
        });

        scraper.on("error", (e) => {
            console.error(e);
            started = false;
        });
    } catch (e) {
        console.error(e);
        started = false;
    }
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

bot.onText(/\/startTop (.*)/, async (msg) => {
    if (wid != msg.chat.id) return;

		scrape(msg.text, "top");
});

bot.onText(/\/startLatest (.*)/, async (msg) => {
		if (wid != msg.chat.id) return;

		scrape(msg.text, "latest");
});
