const { buildSchema } = require('graphql');

const schema = buildSchema(`
    type Query {
      books: [Book]
      people(id: ID!): People
      hello : String
    }

    type Book {
        title: String!
        author: String!
    }


    type People {
        id: ID
        name: String!
    }
`);

module.exports = schema;