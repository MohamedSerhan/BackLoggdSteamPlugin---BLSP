//Copyright 2023 Qewertyy, MIT License

import { Router, Request, Response } from "express";
const Route = Router();

function home(_req: Request, res: Response): void {
  const response = {
    code:2,
    message:"Unofficial Backloggd API.",
  };
  res.status(200).json(response);
}


Route
  .get('/', (req: Request,res: Response) => {
    return home(req,res);
  })
  .post('/', (req: Request, res: Response) => {
      return home(req,res);
  });

export default Route;