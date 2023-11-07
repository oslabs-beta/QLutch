const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLID,
  GraphQLInputObjectType,
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
    // films: {
    //   type: GraphQLList(FilmType)},
    films: {
      type: new GraphQLList(FilmType),
      args: { id: { type: GraphQLInt } },
      resolve: async (parent, args, context, info) => {
        //store film objects listed in character document
        const findFilms = parent.films;
        //create array to return films
        const characterFilms = [];
        //iterate through findFilms - cannot use forEach because it does not accommodate asynchronous calls
        for (let i = 0; i < findFilms.length; i++) {
          //isolate film id - use toString() to remove mongo ObjectId context
          const filmId = findFilms[i].id.toString();
          //query database with filmId - use findOne so you only get the object back NOT in an array
          const film = await Film.findOne({ _id: filmId });
          //push film to characterFilms
          characterFilms.push(film);
        }
        //return characterFilms array to frontend
        return characterFilms;
      },
    },
  }),
});

const FilmType = new GraphQLObjectType({
  name: "Film",
  fields: () => ({
    title: { type: GraphQLString },
    director: { type: GraphQLString },
  }),
});

const FilmInput = new GraphQLInputObjectType({
  name: "FilmInput",
  fields: {
    id: { type: GraphQLString },
  },
});

const databaseSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      person: {
        type: PersonType,
        //had to change arguments to name to work with starwars database in MongoDB
        args: { name: { type: GraphQLString }, id: { type: GraphQLInt } },
        resolve: async (parent, args, context, info) => {
          try {
            return await Person.findOne({ id: args.id });
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
            return await Film.findOne({ episode_id: args.id });
          } catch (error) {
            throw error;
          }
        },
      },
    },
  }),
  mutation: new GraphQLObjectType({
    name: "Mutation",
    fields: {
      addPerson: {
        type: PersonType,
        args: {
          name: { type: GraphQLString },
          id: { type: GraphQLInt },
          height: { type: GraphQLInt },
          hair_color: { type: GraphQLString },
          films: { type: new GraphQLList(FilmInput) },
        },
        resolve: async (parent, args, context, info) => {
          try {
            const { name, id, height, hair_color, films } = args;
            return await Person.create({ id, name, height, hair_color, films });
            // console.log('args: ', args)
          } catch (error) {
            throw error;
          }
        },
      },
    },
  }),
});

module.exports = databaseSchema;
