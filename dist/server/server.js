"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_2 = require("graphql-http/lib/use/express");
const schema_1 = __importDefault(require("./schema"));
const app = (0, express_1.default)();
const number = 3;
app.use(express_1.default.json());
app.use('/graphql', (0, express_2.createHandler)({ schema: schema_1.default }));
app.listen(3000, () => console.log("🚀 Server is listening on port 3000!"));
