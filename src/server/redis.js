const redis = require("redis").createClient();

(async () => {
  console.log('connecting to redis client');
  redis.on("error", (error) => console.error(`Ups : ${error}`));
  await redis.connect();
})();

module.exports = redis;