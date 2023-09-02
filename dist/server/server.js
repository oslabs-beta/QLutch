// import { typeDefs } from "./schema";
// import {Query} from "./resolvers/query"
// import { mongoose } from "mongoose";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { createClient } from 'redis';
//set up redis client
const client = createClient();
client.on('error', err => console.log('Redis Client Error', err));
await client.connect();
await client.set('redis', 'wheeeee');
const value = await client.get('redis');
console.log(value);
const typeDefs = `#graphql
  type Query {
    # people(id: ID!) : People
    hello: String!
    redis: String
  }

  # type People {
  #   id: ID!
  #   name: String!
  # }

`;
const Query = {
    hello: () => "Test Success, GraphQL server is up & running !!",
    redis: async () => {
        const test = await client.get('redis');
        return test ? test : "item not cached";
    }
    // people: (parents, args, context) => {
    //   const peopleId = args.id;
    //   console.log('inside resolver')
    //   fetch(`http://swapi.co/api/people/${peopleId}`)
    //     .then((data) => data.json())
    //     .then((result) => console.log(result));
    // },
};
const server = new ApolloServer({
    typeDefs,
    resolvers: {
        Query,
    },
});
const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
});
console.log(`🚀  Server ready at: ${url}`);
