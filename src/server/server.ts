import express, { Request, Response } from "express";
// import { createHandler } from 'graphql-http/lib/use/express';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./schema";
import {Query} from "./resolvers/query"
// import schema from "./schema";

// const app = express();
// const number = 3;

// app.use(express.json());

// app.use('/graphql', createHandler({ schema }));

//from package.json - old start script
// https://www.tsmean.com/articles/learn-typescript/typescript-module-compiler-option/

const server = new ApolloServer({
  typeDefs,
  resolvers: {
    Query,
  },
});

// app.listen(3000, () => console.log("🚀 Server is listening on port 3000!"));
// server.listen().then(({ url : String }) => {
//     console.log('Server is ready at ' + url)
// });
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);
