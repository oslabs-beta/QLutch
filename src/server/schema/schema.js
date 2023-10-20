const
    {
        GraphQLSchema,
        GraphQLObjectType,
        GraphQLList,
        GraphQLString,
        GraphQLInt,
        GraphQLID,
    } = require('graphql');

const PersonType = new GraphQLObjectType({
    name: "Person",
    fields: () => ({
        name: {
            type: GraphQLString
        },
        height: {
            type: GraphQLInt
        },
        hair_color: {
            type: GraphQLString
        },
        films: {
            type: new GraphQLList(FilmType),
            args: { id: { type: GraphQLInt } },
            resolve: (parent, args, context, info) => {
                return new Promise((resolve, reject) => {
                    fetch(`http://swapi.dev/api/films/`)
                    .then((data) => data.json())
                    .then((data) => {
                        resolve(data.results.filter((film) => parent.films.includes(film.url)));
                    })
                    .catch((error) => {
                        reject(error);
                    });
                });
            },
        }   
    }),
})

const FilmType = new GraphQLObjectType({
    name: "Film",
    fields: () => ({
        title: { type: GraphQLString },
        director: { type: GraphQLString },
        url: { type: GraphQLString},
    })
})

const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'Query',
        fields: {
            person: {
                type: PersonType,
                args: { id: { type: GraphQLInt } },
                resolve: (parent, args, context, info) => {
                    return new Promise((resolve, reject) => {
                        fetch(`http://swapi.dev/api/people/${args.id}`)
                        .then((data) => data.json())
                        .then((result) => {
                            resolve(result);
                        })
                        .catch((error) => {
                            reject(error);
                        });
                    });
                },
            },
            film: {
                type: FilmType,
                args: { id: { type: GraphQLInt } },
                resolve: (parent, args, context, info) => {
                    return new Promise((resolve, reject) => {
                        fetch(`http://swapi.dev/api/films/${args.id}`)
                        .then((data) => data.json())
                        .then((result) => {
                            resolve(result);
                        })
                        .catch((error) => {
                            reject(error);
                        });
                    });
                },
            },
        },
    }),
});

module.exports = schema;