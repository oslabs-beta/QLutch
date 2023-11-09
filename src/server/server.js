const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { graphqlHTTP } = require("express-graphql");
const { GraphQLSchema, GraphQLObjectType, GraphQLString } = require('graphql');
// const schema = require("./schema/schema");q
const schema = require("./schema/database_schema");
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
app.use("/qlutch", qlutch("http://localhost:4000/graphql", redis), (req, res) => {
  // console.log("response from server file: ", res.locals.response);
  return res.json(res.locals.response);
})

app.use(
  '/graphql',
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

app.use((req,res) => {return res.status(404).send('youve reached the wrong place');});

const defaultErr = {
  log: 'Express error handler caught unknown middleware error',
  status: 400,
  message: { err: 'An error occurred' }, 
};

app.use((err, req, res, next) => {
  const errorObj = Object.assign(defaultErr, err);
  return res.status(errorObj.status).send(errorObj.message);
});

app.listen(port), console.log(`Server running on ${port} `);
