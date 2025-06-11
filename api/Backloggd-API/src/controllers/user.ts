//Copyright 2023 Qewertyy, MIT License

import { Router, Request, Response } from "express";
import { getUserInfo } from "../lib/user";
import { getGameInfo } from "../lib/gameInfo";
const Route = Router();

// Replace console.log with a logger (placeholder for now)
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
};

// Retrieves Basic User Info and Favorite Games
async function userInfo(req: Request, res: Response) {
  const { username } = req.params;
  const startTime = performance.now();
  logger.info(`Getting user information for: ${username}`);
  if (!username) {
    return res
      .status(400)
      .json({
        message: "Username is required",
        code: 0,
        details: "/:username",
      });
  }
  try {
    const response = await getUserInfo(username);
    const endTime = performance.now();
    const runTime = ((endTime - startTime)/1000).toFixed(2);
    logger.info(`Received user information for: ${username}. This took approx ${runTime} seconds.`);
    if ((response as any).error) {
      return res
        .status((response as any).status || 500)
        .json({ message: (response as any).error, code: 0 });
    }
    return res.status(200).json({
      message: "success",
      code: 2,
      content: response,
    });
  } catch (err: any) {
    logger.error(`Error fetching user info for ${username}:`, err);
    return res.status(500).json({ message: "Internal server error", code: 0 });
  }
}

// Retrieves the entire User Wishlist
async function gameInfo(req: Request, res: Response, type?: string) {
  const { username } = req.params;
  const startTime = performance.now();
  logger.info(`Scraping ${type} game list information for ${username}`);
  if (!username) {
    return res
      .status(400)
      .json({
        message: "Username is required",
        code: 0,
        details: "/:username",
      });
  }
  try {
    const response = await getGameInfo(username, type);
    const endTime = performance.now();
    const runTime = ((endTime - startTime)/1000).toFixed(2);
    logger.info(`Received ${type} game list information for ${username}. This took approx ${runTime} seconds.`);
    if ((response as any).error) {
      return res
        .status((response as any).status || 500)
        .json({ message: (response as any).error, code: 0 });
    }
    return res.status(200).json({
      message: "success",
      code: 2,
      content: response,
    });
  } catch (err: any) {
    logger.error(`Error fetching game info for ${username} (${type}):`, err);
    return res.status(500).json({ message: "Internal server error", code: 0 });
  }
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
