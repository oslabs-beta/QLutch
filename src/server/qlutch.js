const fetch = require("node-fetch");
const redis = require("./redis");

module.exports = function (graphQlPath) {
    return async function (req, res, next) {
        console.log('qlutch init')
        console.log("req.body 1: " + JSON.stringify(req.body))
        const cachedData = await redis.get(JSON.stringify(req.body))
        console.log(`data: ${cachedData}`);
        if (cachedData) {
            console.log("if yes");
            res.locals.response = cachedData;
        } else {
            console.log("if no")
            fetch(graphQlPath, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                // "Content-Length": 2

            },
            body: JSON.stringify(req.body)
        })
            .then((data) => console.log(data))
            // .then((data) => {
            //     console.log(`fetched, json'd data: ${data}`);
            //     redis.set(JSON.stringify(req.body), data);
            //     res.locals.response = data;
            // })
        }
        console.log("end of qlutch")
        next();
    }
}