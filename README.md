# twitter-x-scraper
scrape from twitter/x and post to facebook page, control via telegram bot


## Installation

Line by line:


```bash
git clone https://github.com/RFS-ADRENO/twitter-x-scraper.git
cd twitter-x-scraper

npm install
```


## Configuration

Rename `.env.example` to `.env` and fill in the values.

Linux:
```bash
mv .env.example .env
```

Windows:
```bash
rename .env.example .env
```

### Telegram Bot

Create new telegram bot via [BotFather](https://t.me/BotFather) and get the token. <br/>
For more information, see [here](https://core.telegram.org/bots/tutorial).

Create new telegram channel and add the bot. <br/>
Now fill in the values in `.env` file

```env
TELEGRAMBOT_TOKEN="your_token_here"
WHITELIST_CHAT_ID="your_channel_id_here"
```

Start the bot

```bash
npm start
```

Go to your channel and send `/uid`, the bot will send you your id. <br/>
Grab the id and fill in the `.env` file

```env
ADMIN_IDS="id1,id2,id3"
```

> As you can see, you can add multiple ids, just separate them with comma.
The bot will only accept commands if the channel id is equal to `WHITELIST_CHAT_ID` and the sender id is equal to one of the `ADMIN_IDS`.

### Facebook App

First you need to create a facebook app from [here](https://developers.facebook.com/apps/). <br/>

Follow the steps below while creating the app:

Choose `Other`

![step-1](https://github.com/RFS-ADRENO/twitter-x-scraper/assets/77768272/7c7e0c71-fe50-46ac-a7ea-fb4c7a5dbe5d)

Chose `Business`

![step-2](https://github.com/RFS-ADRENO/twitter-x-scraper/assets/77768272/09084a87-7270-4c7f-be68-ce86ef263093)

Then fill in the app name and contact email and click `Create App`

![step-3](https://github.com/RFS-ADRENO/twitter-x-scraper/assets/77768272/dd4608c1-292f-4cb9-b53f-fab098f432fb)


Now, you need a Privacy Policy URL. <br/>
You can create one from [here](https://app.freeprivacypolicy.com/wizard/privacy-policy) for free. <br/>

Then navigate to `App settings` > `Basic` and fill in the Privacy Policy URL and click `Save Changes`

![image](https://github.com/RFS-ADRENO/twitter-x-scraper/assets/77768272/fbdea232-c3f8-4076-b932-e54a5de19298)

![image](https://github.com/RFS-ADRENO/twitter-x-scraper/assets/77768272/12c40c02-b51a-47a1-8a6f-a52aebc226a5)

<br />

Now toggle the `App Mode` from `Development` to `Live`

![image](https://github.com/RFS-ADRENO/twitter-x-scraper/assets/77768272/6744ef5d-fd62-4333-97ab-b5cc95650cab)


### Facebook Page

This bot support posting to multiple facebook pages. <br/>
First, create a page from [here](https://www.facebook.com/pages/create) if you haven't already. <br/>

Then go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/) and select your app from the dropdown menu. <br/>
Then click `Get Token` > `Get Page Access Token`

Follow the instructions and select pages that you want to post to. <br/>

![image](https://github.com/RFS-ADRENO/twitter-x-scraper/assets/77768272/64dcf716-7aa9-4ade-ba5e-db763722d31a)

![image](https://github.com/RFS-ADRENO/twitter-x-scraper/assets/77768272/93108cef-c5b7-4bab-b455-14ff5cd4289c)

After you connected pages to your app, click `Get Token` or `User Token`, this time you will see your page names. <br/>
Select the page that you want to post, add `pages_manage_posts` permission. <br/>
Then click `Generate Access Token` then copy the token.

![image](https://github.com/RFS-ADRENO/twitter-x-scraper/assets/77768272/4842542d-36c3-4150-801a-947e6d2d8a8d)

![image](https://github.com/RFS-ADRENO/twitter-x-scraper/assets/77768272/84d1e462-3731-45bd-bc9e-dff43ea815f8)

![image](https://github.com/RFS-ADRENO/twitter-x-scraper/assets/77768272/cd47218b-9b60-45d2-8a68-f704b9e0f110)

![image](https://github.com/RFS-ADRENO/twitter-x-scraper/assets/77768272/1ace9d85-2e1a-4fb8-a07c-5b356cb6263a)

Then copy the token and paste it in `.env` file

> Because this bot support posting to multiple pages, you need to follow the naming rule.

```env
FBTOKEN_PAGE_ONE = "your_token_here"
FBTOKEN_PAGE_TWO = "your_token_here"
```


### Start the program

Now all done, you can start the program

```bash
npm start
```

Go to your telegram channel and send `/pages` to see the list of pages that you connected to your app. <br/>

## Commands

| Command | Description |
| --- | --- |
| `/uid` | Get your telegram id |
| `/pages` | Get the list of pages that you connected to your app |
| `/startTop` | Start scraping from top section |
| `/startLatest` | Start scraping from latest section |
| `/stop` | Stop scraping |

### Example

![image](https://github.com/RFS-ADRENO/twitter-x-scraper/assets/77768272/1828f148-30df-4be6-927c-cf85072876dc)

![image](https://github.com/RFS-ADRENO/twitter-x-scraper/assets/77768272/cf32b338-2de3-402c-85dd-6e9bc33a5865)

`startTop` and `startLatest` commands will add a job to the queue. <br/>
The job will be executed when the previous job is finished. <br/>

`/startTop pageNumber | hashtag1 hashtag2 ...` <br/>
`/startLatest pageNumber | hashtag1 hashtag2 ...`

for example: `/startTop 1 | openai gpt`
This will scrape from top section of tweets that contains both `openai` and `gpt` hashtags.


## LICENSE

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
