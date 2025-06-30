//Copyright 2023 Qewertyy, MIT License

import { Router, Request, Response } from "express";
import { clearCache } from "../lib/cache";
// @ts-ignore
import { logError, logInfo } from "../../../../services/logColors";

const Route = Router();

Route.post("/refresh-cache", (req: Request, res: Response) => {
  try {
    logInfo("Clearing cache...");
    clearCache();
    res.status(200).json({ message: "Cache cleared successfully", code: 2 });
  } catch (err) {
    logError("Error clearing cache:");
    console.error(err);
    res.status(500).json({ message: "Failed to clear cache", code: 0 });
  }
});

export default Route;
