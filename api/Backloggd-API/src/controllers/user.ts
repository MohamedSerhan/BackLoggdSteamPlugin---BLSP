//Copyright 2023 Qewertyy, MIT License

import { Router, Request, Response } from "express";
import { getUserInfo } from "../lib/user";
import { getGameInfo } from "../lib/gameInfo";
const Route = Router();

// Retrieves Basic User Info and Favorite Games
async function userInfo(req: Request, res: Response) {
  const { username } = req.params;
  const startTime = performance.now();
  console.log(`Getting user information for: ${username}`);
  if (!username) {
    return res
      .status(400)
      .json({
        message: "Username is required",
        code: 0,
        details: "/:username",
      });
  }
  const response = await getUserInfo(username);
  const endTime = performance.now();
  const runTime = ((endTime - startTime)/1000).toFixed(2);
  console.log(`Recieved user information for: ${username}. This took approx ${runTime} seconds.`);
  if (response.error) {
    return res
      .status(response.status || 500)
      .json({ message: response.error, code: 0 });
  }
  return res.status(200).json({
    message: "success",
    code: 2,
    content: response,
  });
}

// Retrieves the entire User Wishlist
async function gameInfo(req: Request, res: Response, type?: string) {
  const { username } = req.params;
  const startTime = performance.now();
  console.log(`Scrapping ${type} game list information for ${username}`);
  if (!username) {
    return res
      .status(400)
      .json({
        message: "Username is required",
        code: 0,
        details: "/:username",
      });
  }
  const response = await getGameInfo(username, type);
  const endTime = performance.now();
  const runTime = ((endTime - startTime)/1000).toFixed(2);
  console.log(`Recieved ${type} game list information for ${username}. This took approx ${runTime} seconds.`);
  if (response.error) {
    return res
      .status(response.status || 500)
      .json({ message: response.error, code: 0 });
  }
  return res.status(200).json({
    message: "success",
    code: 2,
    content: response,
  });
}

Route
    .get("/:username", async (req: Request, res: Response) => {
        return await userInfo(req, res);
    })
    .post("/:username", async (req: Request, res: Response) => {
        return await userInfo(req, res);
    })
    .get("/:username/wishlist", async (req: Request, res: Response) => {
      return await gameInfo(req, res, 'wishlist');
    })
    .get("/:username/played", async (req: Request, res: Response) => {
      return await gameInfo(req, res, 'played');
    })
    .get("/:username/playing", async (req: Request, res: Response) => {
      return await gameInfo(req, res, 'playing');
    })
    .get("/:username/backlog", async (req: Request, res: Response) => {
      return await gameInfo(req, res, 'backlog');
    });

export default Route;
