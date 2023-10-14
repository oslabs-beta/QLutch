const fetch = require("node-fetch");
const redis = require("./redis");
const { request } = require("graphql-request");
const { visit } = require('graphql')
const { parse } = require('graphql/language')
const schema = require('./schema/schema');

module.exports = function (graphQlPath) {
    return async function (req, res, next) {
        console.log('---- in QLutch ---- ')

        const parsedQuery = parse(req.body.query);

        //USE INTROSPECTION TO IDENTIFY TYPES

        const typesArr = [];

        // let data = await request(`${graphQlPath}`, `{
        // __schema {
        //   types{
        //     name
        //     fields {
        //       name
        //       args {
        //         name
        //       }
        //     }
        //   }
        // }`
        // )

        let data = await request(`${graphQlPath}`, `{
            __schema{
                types{
                  name
                  fields {
                    name
                    type{
                      name
                      ofType {
                        name
                      }
                    }
                  }
                }
              }
          }`
        )

        data.__schema.types[0].fields.forEach((type) => typesArr.push(type.name))
        //   console.log('typesArr: ', typesArr)
        // data.__schema.types.forEach((el) => console.log(el))


        // Variables to store data from query
        let operation = '';
        const types = [];
        const fields = [];
        const argument = [];


        const argVisitor = {
            Argument: (node) => {
                // console.log('Argument: ', node)
                // console.log('Argument: ', node.value.value)
                return { [node.name.value]: node.value.value }
            },
        }

        const typeVisitor = {
            ObjectTypeDefinition: (node) => {
                console.log('ObjectTypeDefinition: ', node)
            },
        }
        const visitor = {
            // ObjectTypeDefinition: (node) => {
            //     console.log('ObjectTypeDefinition: ', node)
            // },
            // ObjectTypeExtension: (node) => {
            //     console.log('ObjectTypeExtension: ', node)
            // },
            // VariableDefinition: (node) => {
            //     console.log('ObjectTypeExtension: ', node)
            // },
            // Variable: (node) => {
            //     console.log('ObjectTypeExtension: ', node)
            // },
            // SelectionSet: (node) => {
            //     console.log('SelectionSet: ', node.selections[0])
            // },
            // ListType: (node) => {
            //     console.log('ListType: ', node)
            //     return node;
            // },
            OperationDefinition: (node) => {
                // console.log('Operation: ', node.selectionSet.selections[0].name.value)
                operation = node.operation;
            },
            Field: (node) => {
                // console.log('Field: ', node.arguments[0])
                if (typesArr.includes(node.name.value)) {
                const args = visit(node, argVisitor)
                // console.log('args: ', args)
                types.push({ [node.name.value]: args.arguments[0] })
                // if (node.arguments.length) {
                //     const args = visit(node, argVisitor)
                //     // console.log('args: ', args)
                //     fields.push({ [node.name.value]: args.arguments[0] })
                } else fields.push(node.name.value);
            },
        }

        const ast = visit(parsedQuery, visitor);
        // const ast = visit(parse(JSON.stringify(data)), typeVisitor);
        console.log('operation: ', operation);
        console.log('fields: ', fields);
        console.log('types: ', types);
        // console.log('argument: ', argument);
        // console.log('parsedQuery: ', parsedQuery.definitions[0].selectionSet.selections[0]);







        // const cachedData = await redis.get(JSON.stringify(req.body.query))

        // if (cachedData) {
        //     console.log("if yes");

        //     res.locals.response = cachedData;

        //     return next();
        // } else {
        //     console.log("if no")

        //     let data = await request(`${graphQlPath}`, req.body.query)

        //     res.locals.response = data;

        //     redis.set(JSON.stringify(req.body.query), JSON.stringify(data))
        //     return next()
        // }
    }
}