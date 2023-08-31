import express, { Request, Response } from "express";
import { createHandler } from 'graphql-http/lib/use/express';
import schema from "./schema";

const app = express();
const number = 3;

app.use(express.json());

app.use('/graphql', createHandler({ schema }));


app.listen(3000, () => console.log("🚀 Server is listening on port 3000!"));
