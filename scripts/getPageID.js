import axios from "axios";

async function getPAGEID(pageToken, tokenName) {
    console.log("[ INTERNAL ] Retrieving pageID for", tokenName);
    const res = await axios.get(
        `https://graph.facebook.com/v18.0/me?access_token=${pageToken}`
    );

    console.log("[ INTERNAL ] Got pageID for", tokenName, ":", res.data.id);

    return res.data.id;
}

export default getPAGEID;
