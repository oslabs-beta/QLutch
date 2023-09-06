const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql');
const schema = require('./schema/schema')
const rootValue = require('./resolvers/rootValue')
const port = process.env.PORT || 4000
const path = require('path');
const DIST_DIR = path.join(__dirname, '../dist');
const HTML_FILE = path.join(DIST_DIR, 'index.html');
const redis = require("./redis");

const app = express();
app.use(express.static(DIST_DIR));
app.use(cors());

// serving html file with react app
app.get('/', (req, res) => {
  res.sendFile(HTML_FILE);
});


// serving graphQL & graphiql
app.use('/graphql', graphqlHTTP({
  schema,
  rootValue,
  graphiql: true
}));

app.listen(port), console.log(`Server running on ${port} `)















// graphQl schema
// const Schema = `#graphql
//   type Query {
//     people(id: ID!) : People
//   }

//   type People {
//     id: ID!
//     name: String!
//   }
// `;

// graphQl resolvers
// const Query = {
//   // hello: () => "Test Success, GraphQL server is up & running !!",
//   people: (parents, args, context) => {
//     const peopleId = args.id;
//     console.log('inside resolver')

//     fetch(`http://swapi.dev/api/people/${peopleId}`)
//       .then((data) => data.json())
//       .then((result) => console.log(result));
//   },
// };