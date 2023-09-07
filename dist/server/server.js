import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from "body-parser";
// import { startStandaloneServer } from "@apollo/server/standalone"; --COMMENTED OUT
// import { mongoose } from "mongoose"; --COMMENTED OUT
// import fetch from 'node-fetch';
// import { typeDefs } from "./schema";
// import {Query} from "./resolvers/query"
// const typeDefs = `#graphql
//   type Query {
//     people(id: ID!) : People
//   }
//   type People {
//     id: ID!
//     name: String!
//   }
// `;
// const Query = {
//   // hello: () => "Test Success, GraphQL server is up & running !!",
//   people: (parents, args, context) => {
//     const peopleId = args.id;
//     console.log('inside resolver')
//     fetch(`http://swapi.dev/api/people/${peopleId}`) //swapi.dev  .co
//       .then((data) => data.json())
//       .then((result) => console.log(result));
//   },
// };
const typeDefs = `#graphql
  type Query {
    hello: String
  }
  `;
const resolvers = {
    Query: {
        hello: () => 'world',
    },
};
const app = express();
const httpServer = http.createServer(app);
// const server = new ApolloServer({
//   typeDefs,
//   resolvers: {
//     Query,
//   },
// });
const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
await server.start();
// const { url } = await startStandaloneServer(server, {
//   listen: { port: 4000 },
// });
app.use(cors(), bodyParser.json(), expressMiddleware(server));
await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
// console.log(`🚀  Server ready at: ${url}`);
console.log(`🚀  Server ready at http://localhost:4000`);
