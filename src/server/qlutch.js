const fetch = require("node-fetch");
const redis = require("./redis");
const { request } = require("graphql-request");

module.exports = function (graphQlPath) {
    return async function (req, res, next) {
        console.log('in QLutch')

        const cachedData = await redis.get(JSON.stringify(req.body.query))

        if (cachedData) {
            console.log("if yes");

            res.locals.response = cachedData;

            return next();
        } else {
            console.log("if no")

            let data = await request(`${graphQlPath}`, req.body.query)

            res.locals.response = data;

            redis.set(JSON.stringify(req.body.query), JSON.stringify(data))
            return next()
        }
    }
}