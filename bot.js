import TelegramBot from "node-telegram-bot-api";
import { TwitterScraper } from "./scripts/scrape.js";
import { publish } from "./scripts/publish.js";

const bot = new TelegramBot(process.env.token, { polling: true });
console.log("Bot started");

let started = false;

bot.onText(/\/stop/, async (msg) => {
    if (process.env.whitelist_chat_id != msg.chat.id) return;

    if (!started) {
        await bot.sendMessage(msg.chat.id, "Not started");
        return;
    }

    await bot.sendMessage(msg.chat.id, "Stopping...");
    await new Promise((resolve) => setTimeout(resolve, 500));
    process.exit(0);
});

bot.onText(/\/start (.*)/, async (msg) => {
    if (process.env.whitelist_chat_id != msg.chat.id) return;

    if (started) {
        bot.sendMessage(msg.chat.id, "Already started");
        return;
    }

    started = true;
    try {
        await bot.sendMessage(msg.chat.id, "Scraping...");
        const args = msg.text
            .split(" ")
            .slice(1)
            .filter((e) => e);

        const scraper = new TwitterScraper(args, process.env.cookie);

        scraper.run();

        scraper.on("data", async (data) => {
            console.log("DATA RECEIVED");
						await bot.sendMessage(msg.chat.id, `Received ${data.length} tweets`);
            // for (const each of data) {
            //     const { content, origin, imgLocalPath } = each;

            //     const caption = `${content}\n\n${origin}`;

            //     if (imgLocalPath.length > 1) {
            //         await bot.sendMediaGroup(
            //             msg.chat.id,
            //             imgLocalPath.map((e, i) => {
            //                 return {
            //                     type: "photo",
            //                     media: fs.createReadStream(e),
            //                     caption: i == 0 ? caption : undefined,
            //                 };
            //             })
            //         );
            //     } else {
            //         await bot.sendPhoto(
            //             msg.chat.id,
            //             fs.createReadStream(imgLocalPath[0]),
            //             {
            //                 caption,
            //             }
            //         );
            //     }

            //     await new Promise((resolve) => setTimeout(resolve, 2000));
            // }

            await bot.sendMessage(msg.chat.id, "Publishing...");

            await publish(data, bot, msg.chat.id);

            await bot.sendMessage(msg.chat.id, "Done");
        });

        scraper.on("close", () => {
            started = false;
        });

        scraper.on("error", (e) => {
            console.error(e);
        });
    } catch (e) {
        console.error(e);
        started = false;
    }
});
