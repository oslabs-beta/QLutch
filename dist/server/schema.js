"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { buildSchema } = require("graphql");
const schema = buildSchema(`
  type Query {
    hello: String
  }
`);
exports.default = schema;
