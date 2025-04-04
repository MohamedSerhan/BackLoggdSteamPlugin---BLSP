import axios, { AxiosError } from "axios";
import cheerio from "cheerio";
import config from "../config";


async function scrapeGamePage(username: string, type?: string | undefined, pageIndex?: number | undefined) {
    const referer = `https://${config.baseUrl}/search/users/${username}`;
    const response = await axios
        .get(`https://${config.baseUrl}/u/${username}/games/title/type:${type}?page=${pageIndex}`, {
        headers: {
            ...config.headers,
            "Turbolinks-Referrer": referer,
            Referer: referer,
        },
        })
        .catch((err) => err);

    if (response instanceof AxiosError) {
        console.log(response.response?.status);
        let error, status;
        if (response.response?.status === 404) {
        error = "User not found";
        status = 404;
        } else {
        error = response.message;
        status = response.response?.status || 500;
        }
        return {
        error: error,
        status: status,
        };
    }
    return response.data
}

function capitalizeFirstLetters(str: string) {
    return str.split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}

async function getGameInfo(username: string, type?: string | undefined): Promise<any> {
    const gameList = [];
    let pageIndex = 0;
    

    let currentGameList = ['a'];
    let lastGameList = ['b'];
    while(JSON.stringify(currentGameList) != JSON.stringify(lastGameList)) {
        pageIndex++;
        lastGameList = currentGameList;
        const gamePageData:any = await scrapeGamePage(username, type, pageIndex);
        const $ = cheerio.load(gamePageData);
        const rawGameList = $(".game-cover > a");

        currentGameList = [];

        for (const game of rawGameList) {
            const rawGameName = game.attribs.href;
            const gameName = rawGameName
                .replace(/^\/games\//, '')
                .replace(/-/g, ' ')
                .replace(/\/$/, '')
                .replace(/ {2,}\d+/g, '');
            
            const formattedGameName = capitalizeFirstLetters(gameName);
            currentGameList.push(formattedGameName);
            gameList.push(formattedGameName);
        }
    }

    return gameList;
}

export { getGameInfo };