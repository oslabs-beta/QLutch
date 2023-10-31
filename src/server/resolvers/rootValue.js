const rootValue = {
  person: async (parent, args, context) => {
    // if data check is empty array, that means the person we're querying for does not exist in the database yet
    const dataCheck = await Person.find({
      name: dataToReturn.data.person.name,
    });
    if (dataCheck.length === 0) {
      //store person data in the database
      await Person.create({
        id: 1,
        name: dataToReturn.data.person.name,
        height: dataToReturn.data.person.height,
        hair_color: dataToReturn.data.person.hair_color,
        films: dataToReturn.data.person.films,
      });
    }
  },
};

module.exports = rootValue;
