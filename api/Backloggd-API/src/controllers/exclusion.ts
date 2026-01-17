import { Router, Request, Response } from "express";
import { excludeGame, unexcludeGame, getExcludedGames } from '../../../../exclusionManager';

const Route = Router();

// Endpoint to exclude a game
Route.post('/exclude-game', (req: Request, res: Response): void => {
    const { gameName, appId, reason } = req.body;

    if (!gameName) {
        res.status(400).json({ success: false, message: 'Game name is required' });
        return;
    }

    const result = excludeGame(gameName, appId, reason);

    res.json({
        success: result.success,
        message: result.message
    });
});

// Endpoint to unexclude a game
Route.post('/unexclude-game', (req: Request, res: Response): void => {
    const { gameName, appId } = req.body;

    if (!gameName) {
        res.status(400).json({ success: false, message: 'Game name is required' });
        return;
    }

    const result = unexcludeGame(gameName, appId);

    res.json({
        success: result.success,
        message: result.message
    });
});

// Endpoint to get all excluded games
Route.get('/get-excluded', (_req: Request, res: Response): void => {
    const data = getExcludedGames();

    res.json({
        success: true,
        excludedGames: data.excludedGames,
        count: data.excludedGames.length,
        lastUpdated: data.lastUpdated
    });
});

export default Route;
