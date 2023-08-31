import express, { Request, Response } from "express";

const app = express();
const number = 2;

app.use(express.json());

app.listen(3000, () => console.log("🚀 Server is listening on port 3000!"));
