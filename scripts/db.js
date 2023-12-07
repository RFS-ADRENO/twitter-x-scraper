import fs from "fs";
import path from "path";
import axios from "axios";

const assetsPath = path.join(process.cwd(), "assets");

const imagesPath = path.join(assetsPath, "images");
const dataPath = path.join(assetsPath, "data.json");

if (!fs.existsSync(assetsPath)) {
    fs.mkdirSync(assetsPath);
}

if (!fs.existsSync(imagesPath)) {
    fs.mkdirSync(imagesPath);
}

if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([]));
}

export const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

export async function add(arr, pageID) {
    const appendData = [];
    if (!pageID) throw new Error("pageID is not defined");

    if (!data.some((e) => e.pageID === pageID)) {
        data.push({
            pageID,
            data: [],
        });
    }

		const pageData = data.find((e) => e.pageID === pageID);

    for (const item of arr) {
				if (pageData.data.some((e) => e.origin === item.origin)) continue;

        console.log();
        console.log(`Saving ${item.origin}`);

        item.imgLocalPath = [];

        for (let i = 0; i < item.imageSrc.length; i++) {
            let imgURL = item.imageSrc[i];
            try {
                const imageBasename = path.basename(imgURL); // ex: F8kh_YLaQAAHsyE?format=jpg&name=medium

                const imgName = imageBasename.split("?")[0]; // ex: F8kh_YLaQAAHsyE
                const imgExt = imageBasename
                    .split("?")[1]
                    .split("=")[1]
                    .split("&")[0]; // ex: jpg

                const imgResolutions = ["medium", "large", "small"];
                const curImgResIndexStart = imageBasename.indexOf("name=") + 5;
                const curImgResIndexEnd = imageBasename.indexOf(
                    "&",
                    curImgResIndexStart
                );
                const curImgRes = imageBasename.slice(
                    curImgResIndexStart,
                    curImgResIndexEnd == -1
                        ? imageBasename.length
                        : curImgResIndexEnd
                );

                if (!imgResolutions.includes(curImgRes)) {
                    item.imageSrc[i] = imgURL.replace(
                        `name=${curImgRes}`,
                        `name=medium`
                    );
                    imgURL = item.imageSrc[i];
                }

                const imgPath = path.join(imagesPath, `${imgName}.${imgExt}`);

                const res = await axios.get(imgURL, {
                    responseType: "stream",
                });

                const writter = fs.createWriteStream(imgPath);
                res.data.pipe(writter);

                await new Promise((resolve) => {
                    writter.on("finish", resolve);
                });

                item.imgLocalPath.push(imgPath);
            } catch (e) {
                console.error(e);
                console.log(`Failed to save ${imgURL}`);
            }
        }

        if (item.imgLocalPath.length == 0) continue;
        for (const imgPath of item.imgLocalPath) {
            console.log(`Saved ${imgPath}`);
        }

				pageData.data.push(item);
        appendData.push(item);
    }

    console.log();

    return appendData;
}

export function save() {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
}
