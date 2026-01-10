//Copyright 2023 Qewertyy, MIT License

import { Router, Request, Response } from "express";
const Route = Router();
import {home,user} from '../controllers';
import refresh from '../controllers/refresh';
import exclusion from '../controllers/exclusion';

Route
    .use('/user', user)
    .use('/refresh', refresh)
    .use('/exclude', exclusion)
    .use('/', home)
    .use('*', (req: Request, res: Response) => res.status(404).json({ message: "not found", code: 0 }))

export default Route;
