import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { mongoose } from "mongoose";
import fetch from 'node-fetch';
// import { typeDefs } from "./schema";
// import {Query} from "./resolvers/query"

const typeDefs = `#graphql
  type Query {
    people(id: ID!) : People
  }

  type People {
    id: ID!
    name: String!
  }

`;
const Query = {
  // hello: () => "Test Success, GraphQL server is up & running !!",
  people: (parents, args, context) => {
    const peopleId = args.id;
    console.log('inside resolver')

    fetch(`http://swapi.co/api/people/${peopleId}`)
      .then((data) => data.json())
      .then((result) => console.log(result));
  },
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
