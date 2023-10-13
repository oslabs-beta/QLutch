const fetch = require("node-fetch");
const redis = require("./redis");
const { request } = require("graphql-request");

module.exports = function (graphQlPath) {
    return async function (req, res, next) {
        console.log('in QLutch')
        // The data is requested from the cache, using the query as a key.
        const cachedData = await redis.get(JSON.stringify(req.body.query))

        // Cache Hit - If the data was retreived, cachedData will be assigned the value of the data.
        if (cachedData) {
            console.log("if yes");
            // The data is saved on the response object, and the middleware terminates.
            res.locals.response = cachedData;

            return next();

        // Cache Miss - If the data was not retreived, cachedData will be assigned the value of null, so the prior conditional will fail, and the else block will be executed.
        } else {

            console.log("if no")
            // The query is passed to the endpoint being served by graphql, the response is saved on the data variable.
            const data = await request(`${graphQlPath}`, req.body.query)

            // The data is saved on the response object.
            res.locals.response = data;
            
            // A new key value pair is set in the cache. The query is the key, and the data is value. Then the middleware terminates.
            redis.set(JSON.stringify(req.body.query), JSON.stringify(data))
            return next()
        }
    }
}