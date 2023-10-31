const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLID,
} = require("graphql");

const { Person, Film } = require("../database");

const PersonType = new GraphQLObjectType({
  name: "Person",
  fields: () => ({
    name: {
      type: GraphQLString,
    },
    height: {
      type: GraphQLInt,
    },
    hair_color: {
      type: GraphQLString,
    },
    films: {
      type: GraphQLList(FilmType)},
  }),
});

const FilmType = new GraphQLObjectType({
  name: "Film",
  fields: () => ({
    title: { type: GraphQLString },
  }),
});

const databaseSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      person: {
        type: PersonType,
        //had to change arguments to name to work with starwars database in MongoDB
        args: {name: { type: GraphQLString }} ,
        resolve: async (parent, args, context, info) => {
          try {
            const result = await Person.findOne({ name: args.name });
            return result;
          } catch (error) {
            throw error;
          }
        },
      },
      film: {
        type: FilmType,
        args: { id: { type: GraphQLInt } },
        resolve: async (parent, args, context, info) => {
          try {
            const result = await Film.findOne({ episode_id: args.id });
            return result;
          } catch (error) {
            throw error;
          }
        },
      },
    },
  }),
});

module.exports = databaseSchema;
