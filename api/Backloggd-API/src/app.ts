//Copyright 2023 Qewertyy, MIT License

import express, { Request, Response, NextFunction } from "express";
import routers from "./routes";
const app = express();

app.set("trust proxy", 1);
app.use(
  express.json({
    limit: "50mb",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
    parameterLimit: 2500000,
  })
);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("X-By", "https://github.com/Qewertyy");
  next();
});

app.all("*", routers);

app.listen(8080, () => {
  console.log(`Server started Listening at 8080`);
});
