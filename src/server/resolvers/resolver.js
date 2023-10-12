const fetch = require("node-fetch");
const redis = require("../redis");

const resolver = {
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
    console.log("inside resolver peopleId: ", peopleId);

    const person = JSON.parse(await redis.get(`id${parent.id}`))
    // JSON.parse(person);
    console.log(typeof person);
    if (person) {
      return { name: person.name, mass: person.mass };
    } else {
      return new Promise((resolve, reject) => {
        fetch(`http://swapi.dev/api/people/${peopleId}`)
          .then((data) => data.json())
          .then((result) => {
            console.log(`result from database: ${result}`);
            redis.set("id1", JSON.stringify({name: result.name, mass: result.mass}));
            resolve({ name: result.name, mass: result.mass });
          })
          .catch((error) => {
            reject(error);
          });
      });
    }
  },
};

module.exports = resolver;
