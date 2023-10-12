const fetch = require("node-fetch");
const redis = require("./redis");

module.exports = function (graphQlPath) {
    return async function (req, res, next) {
        console.log(`req.body: ${JSON.stringify(req.body)}`)
        const cachedData = await redis.get(JSON.stringify(req.body))
        // console.log(`data: ${cachedData}`);
        if (cachedData) {
            console.log("if yes");
            res.locals.response = cachedData;
        } else {
            console.log("if no")
            fetch("http://localhost:4000/actualGraphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(JSON.stringify(req.body))
        })
            .then((data) => {
                console.log(data.json())
                return data.json(JSON.stringify(req.body));
            })
            .then((data) => {
                console.log(`fetched, json'd data: ${data}`);
                redis.set(JSON.stringify(req.body), data);
                res.locals.response = data;
                next();
            })
        }
    }
}