// const { buildSchema } = require("graphql");

// const schema  = buildSchema(`
//   type Query {
//     hello: String
//   }
// `)

// export default schema;


const { gql } = require('apollo-server');

export const typeDefs = gql`
  type Query {
    hello : String!
  }
`
