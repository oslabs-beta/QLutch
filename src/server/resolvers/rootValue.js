const fetch = require("node-fetch");
const redis = require("../redis");

const rootValue = {
  hello: () => {
    return "hello";
  },
  books: [
    {
      title: "The Name of the Wind",
      author: "Patrick Rothfuss",
    },
    {
      title: "The Wise Man's Fear",
      author: "Patrick Rothfuss",
    },
  ],
  people: async (parent, args, context) => {
    const peopleId = parent.id;
    // console.log("inside resolver peopleId: ", peopleId);

    // const person = await redis.get(`id${parent.id}`);
    // if (person) {
    //   return { name: person };
    // } else {
      return new Promise((resolve, reject) => {
        fetch(`http://swapi.dev/api/people/${peopleId}`)
          .then((data) => data.json())
          .then((result) => {
            // console.log(result.name);
            // redis.set("id1", result.name);
            resolve({ name: result.name });
          })
          .catch((error) => {
            reject(error);
          });
      });
    // }
  },
};

module.exports = rootValue;
