import axios from "axios";

//https://graph.facebook.com/v18.0/me/photos
export async function publish(data, bot, chatId) {
	for (const each of data) {
		const { content, origin, imageSrc } = each;

		const uploadedImageIDs = [];

		for (const src of imageSrc) {
			const res = await axios.post(
				`https://graph.facebook.com/v18.0/me/photos?access_token=${process.env.fbtoken}`,
				{
					url: src,
					published: false,
				}
			)

			uploadedImageIDs.push(res.data.id);
			await new Promise(resolve => setTimeout(resolve, 500));
		}

		const res = await axios.post(
			`https://graph.facebook.com/v18.0/me/feed?access_token=${process.env.fbtoken}&fields=permalink_url`,
			{
				message: `${content}\n\n${origin}`,
				attached_media: uploadedImageIDs.map(e => {
					return {
						media_fbid: e
					}
				})
			}
		)

		await bot.sendMessage(chatId, `Published:\n${res.data.permalink_url}`);
		await new Promise(resolve => setTimeout(resolve, 300));
	}
}
