const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { graphqlHTTP } = require("express-graphql");
const { GraphQLSchema, GraphQLObjectType, GraphQLString } = require('graphql');
const schema = require("./schema/schema");
const rootValue = require("./resolvers/rootValue");
const port = process.env.PORT || 4000;
const path = require("path");
const DIST_DIR = path.join(__dirname, "../dist");
const HTML_FILE = path.join(DIST_DIR, "index.html");
const redis = require("./redis");
const qlutch = require("./qlutch")

const app = express();
app.use(express.json());
app.use(express.static(DIST_DIR));
app.use(cors());
// serving html file with react app
app.get("/", (req, res) => {
  res.sendFile(HTML_FILE);
});

// serving graphQL & graphiql
app.use("/graphql", qlutch("http://localhost:4000/actualGraphql"), (req,res) =>{
  return res.json(res.locals.response);
})

app.use (
  '/actualGraphql', 
  graphqlHTTP({
    schema,
    graphiql: true
  })
);

app.get("/badCacheReset", async (req, res) => {
  console.log('Cache Flushed')
  await redis.FLUSHALL();
  res.sendStatus(200);
});

app.listen(port), console.log(`Server running on ${port} `);
