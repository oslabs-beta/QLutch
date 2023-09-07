const rootValue = {
  hello: () => {
    return 'hello'
  },
  books: [
    {
      title: "The Name of the Wind",
      author: "Patrick Rothfuss",
    },
    {
      title: "The Wise Man's Fear",
      author: "Patrick Rothfuss",
    }
  ],
  people: (parent, args, context) => {
    const peopleId = parent.id;
    console.log('inside resolver peopleId: ', peopleId)


    // fetch(`http://swapi.dev/api/people/${peopleId}`)
    //   .then((data) => data.json())
    //   .then((result) => {
    //     console.log(result.name)
    //     return {name : result.name}
    //   })

    return new Promise((resolve, reject) => {
      fetch(`http://swapi.dev/api/people/${peopleId}`)
        .then((data) => data.json())
        .then((result) => {
          console.log(result.name)
          resolve({ name: result.name })
        })
        .catch(error => {
          reject(error);
        });
    })


  }
};


module.exports = rootValue;
