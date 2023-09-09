// const redis = require("redis").createClient();


// module.exports = redis;

const redis = require("redis").createClient({
  password: 'w9ddXaBTKl5wc8Os31IZPsIMdI9MRvhd',
  socket: {
    host: 'redis-19943.c309.us-east-2-1.ec2.cloud.redislabs.com',
    port: 19943
  }
});

(async () => {
  console.log('connecting to redis client');
  redis.on("error", (error) => console.error(`Ups : ${error}`));
  await redis.connect();
})();

module.exports = redis;