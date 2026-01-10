import { Router, Request, Response } from "express";
const Route = Router();
// @ts-ignore
import { excludeGame, unexcludeGame, getExcludedGames } from '../../../../exclusionManager';

// Endpoint to exclude a game
Route.post('/exclude-game', (req: Request, res: Response) => {
    const { gameName, appId, reason } = req.body;
    
    if (!gameName) {
        return res.status(400).json({ success: false, message: 'Game name is required' });
    }
    
    const result = excludeGame(gameName, appId, reason);
    
    res.json({
        success: result.success,
        message: result.message
    });
});

// Endpoint to unexclude a game
Route.post('/unexclude-game', (req: Request, res: Response) => {
    const { gameName, appId } = req.body;
    
    if (!gameName) {
        return res.status(400).json({ success: false, message: 'Game name is required' });
    }
    
    const result = unexcludeGame(gameName, appId);
    
    res.json({
        success: result.success,
        message: result.message
    });
});

// Endpoint to get all excluded games
Route.get('/get-excluded', (req: Request, res: Response) => {
    const data = getExcludedGames();
    
    res.json({
        success: true,
        excludedGames: data.excludedGames,
        count: data.excludedGames.length,
        lastUpdated: data.lastUpdated
    });
});

export default Route;
