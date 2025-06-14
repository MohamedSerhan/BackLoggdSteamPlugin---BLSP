import axios, { Axios, AxiosError } from "axios";
import cheerio from "cheerio";
import config from "../config";
import { favoriteGames, recentlyPlayed, userInfo } from "../types/game";
import { extractGame } from "../utils/game";
import { getCache, setCache } from "./cache";

const USER_INFO_TTL = 60 * 60 * 1000; // 1 hour

async function getUserInfo(
  username: string
): Promise<userInfo | { error: string; status: number }> {
  const cacheKey = `userInfo:${username}`;
  const cached = getCache<userInfo | { error: string; status: number }>(cacheKey);
  if (cached) return cached;

  const referer = `https://${config.baseUrl}/search/users/${username}`;
  const response = await axios
    .get(`https://${config.baseUrl}/u/${username}`, {
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
  const $ = cheerio.load(response.data);
  let userinfo: userInfo = {} as userInfo;
  userinfo.username = username;
  userinfo.profile = $("meta[property='og:image']").attr("content") || "https://backloggd.b-cdn.net/no_avatar.jpg";
  const hasBio = $("#bio-body").has("p").length === 0;
  const userBio = hasBio ? $("#bio-body").text().trim() : "Nothing here!"
  userinfo.bio = userBio;
  const favoriteGames: favoriteGames[] = [];
  const recentlyPlayed: recentlyPlayed[] = [];
  const favoritesDiv = $("#profile-favorites").children();
  const recentlyPlayedDiv = $("#profile-journal").children();
  const userStatsDiv = $("#profile-stats").children();
  const userStats: { [key: string]: number } = {};
  userStatsDiv.each((i, el) => {
    const value = $(el).children("h1").text();
    const key = $(el).children("h4").text();
    userStats[key] = parseInt(value);
  });
  favoritesDiv.each((i, el) => {
    const game = extractGame($(el));
    if (game) {
      const mostFavorite = el.attribs.class.includes("ultimate_fav");
      favoriteGames.push({ ...game, mostFavorite });
    }
  });
  recentlyPlayedDiv.each((i, el) => {
    const game = extractGame($(el));
    if (game) {
      recentlyPlayed.push({ ...game });
    }
  });
  userinfo.favoriteGames = favoriteGames;
  userinfo.recentlyPlayed = recentlyPlayed;
  userinfo = { ...userinfo, ...userStats };
  setCache(cacheKey, userinfo, USER_INFO_TTL);
  return userinfo;
}

export { getUserInfo };
