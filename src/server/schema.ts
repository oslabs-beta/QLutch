const { buildSchema } = require("graphql");

const schema  = buildSchema(`
  type Query {
    hello: String
  }
`)

export default schema;