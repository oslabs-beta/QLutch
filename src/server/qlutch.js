const fetch = require("node-fetch");
const redis = require("./redis");
const { request, gql } = require("graphql-request");
const {
  visit,
  __EnumValue,
  __Directive,
  __DirectiveLocation,
} = require("graphql");
const { parse } = require("graphql/language");
const schema = require("./schema/schema");

module.exports = function (graphQlPath) {
  return async function (req, res, next) {
    console.log("---- in QLutch ---- ");

    const parsedQuery = parse(req.body.query);

    //USE INTROSPECTION TO IDENTIFY TYPES

    // array to store all query types
    const typesArr = [];

    // excluded typenames that are automatically returned by introspection
    const excludedTypeNames = [
      "Query",
      "String",
      "Int",
      "Boolean",
      "__Schema",
      "__Type",
      "__TypeKind",
      "__Field",
      "__EnumValue",
      "__Directive",
      "__DirectiveLocation",
    ];

    //using introspection query
    let data = await request(
      `${graphQlPath}`,
      `{
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
    );

    // PARSING THROUGH QUERIES WITH ARGS AND STORING THEM IN TYPESARR
    // console.log('data: ', data.__schema.types)
    data.__schema.types[0].fields.forEach((type) => {
      // console.log(type)
      typesArr.push(type.name);
    });

    // PARSING THROUGH EACH FIELD TO CHECK TYPEOF EXIST TO FIND TYPES INSIDE NESTED QUERY
    data.__schema.types.forEach((type) => {
      // check if current type name is inside excluded typeArr
      if (!excludedTypeNames.includes(type.name)) {
        // if not in typeArr iterate through current field
        type.fields.forEach((field) => {
          // if ofType field is truthy && it's a string && it's included in typeArr
          if (
            field.type.ofType &&
            typeof field.type.ofType.name === "string" &&
            typesArr.includes(field.type.ofType.name.toLowerCase())
          ) {
            // console.log('field: ', field);
            typesArr.push(field.name);
          }
        });
      }
    });

    // Variables to store data from query received from visitor function
    let operation = "";
    const types = [];
    const fields = [];

    // create a var to store main field with args if any
    let rootField;
    // create a var to store an object of arrays
    const fieldsToCache = [];

    // visitor object for arguments is called from field method in main visitor object with the input of current field node
    const argVisitor = {
      Argument: (node) => {
        // console.log('Argument: ', node)
        // console.log('Argument: ', node.value.value)
        // return { [node.name.value]: node.value.value }
        return `(${node.name.value}:${node.value.value})`;
      },
    };

    // main visitor object that builds out field array
    const visitor = {
      OperationDefinition: (node) => {
        // console.log('Operation: ', node.selectionSet.selections[0].name.value)
        operation = node.operation;
      },
      Field: (node) => {
        // create a var to store an current field name
        const currentField = node.name.value;
        // console.log('currentField: ', currentField)

        // check if field is in typesArr
        if (typesArr.includes(currentField)) {
          // if field is first element in typesArr
          if (currentField === typesArr[0]) {
            // reassign root var with root field of first element in typesArr with arguments from visiotr function if any
            rootField = currentField;
            // console.log('rootField: ', rootField);

            // check if there are args on current node and if so call argument visitor method
            if (node.arguments.length) {
              const args = visit(node, argVisitor);
              // add to main root
              // console.log('args: ', args.arguments[0])
              rootField = rootField.concat(args.arguments[0]);
              // console.log('rootField: ', rootField);
            }
          }
          // NOT DRY - CHECKING FOR ARGS TWICE
          // else re-assign currentType to current type
          // check for args
          else {
            let currentType = node.name.value;
            // console.log('currentType: ', currentType)
            if (node.arguments.length) {
              const args = visit(node, argVisitor);
              // add to currentType
              currentType = currentType.concat(args.arguments[0]);
            }
            // add to main root
            rootField = rootField.concat(currentType);
          }
        } // else add each field to root value and build out object
        else {
          fieldsToCache.push(rootField.concat(node.name.value));
        }
      },
    };

    const ast = visit(parsedQuery, visitor);
    console.log("operation: ", operation);
    console.log("fieldsToCache: ", fieldsToCache);
    // console.log('fields: ', fields);
    // console.log('types: ', types);
    // console.log('typesArr: ', typesArr);

    // create a var to return response data
    const dataToReturn = {
      data: {},
    };

    // function to build dataToReturn object

    // function buildDataToReturnObj(dataForObject, toReturn) {

    //     // create a var to store root value
    //     const rootObject = {};

    //     console.log('dataForObject: ', dataForObject);
    //     // iterate through input object and store root object
    //     for (const key in dataForObject) {
    //         console.log('key: ', key, dataForObject[key])
    //         dataToReturn.data = rootObject
    //         rootObject[key] = dataForObject[key]
    //         dataToReturn.data = rootObject
    //     }

    //     console.log('rootObject: ', rootObject);
    //     // console.log('dataToReturn: ', dataToReturn.data = rootObject)
    //     // console.log('dataToReturn: ', dataToReturn.data[rootObject])

    // }

    function deepMerge(...objects) {
      console.log("objects: ", objects);
      return objects.reduce((merged, obj) => {
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && typeof obj[key] === "object") {
            if (!merged[key]) {
              merged[key] = {};
            }
            merged[key] = deepMerge(merged[key], obj[key]);
          } else {
            merged[key] = obj[key];
          }
        }
        return merged;
      }, {});
    }

    // // creating data array to pass to deepmerge function
    // const cachedDataArr = [];

    // // iterate through fieldsToCache array and check each element if stored in redis
    // fieldsToCache.forEach(async (field) => {
    //     // console.log('field: ', field);
    //     // console.log(JSON.parse(field));

    //     //check redis if key is stored and return value
    //     const cachedData = JSON.parse(await redis.get(field))

    //     if (cachedData) {
    //         // console.log('cachedData: ', cachedData)
    //         cachedDataArr.push(cachedData)
    //         // console.log('chachedDataArr: ', cachedDataArr)
    //         console.log("if yes");
    //         // console.log('cachedData: ', cachedData)

    //         // dataToReturn.data = buildDataToReturnObj(cachedData, dataToReturn);
    //         // dataToReturn.data = deepMerge(cachedDataArr);

    //         // dataToReturn.data = cachedData
    //         console.log('dataToReturn: ', dataToReturn)

    //         // res.locals.response = cachedData;

    //         // return next();

    //     } else {
    //         console.log("if no")

    //         // create graphql query
    //         let parsedGraphQLQuery = `query {`

    //         let curlyBracesCount = 1;

    //         field.split('').forEach((char) => {
    //             if (char === ')') {
    //                 parsedGraphQLQuery = parsedGraphQLQuery.concat(char + '{')
    //                 curlyBracesCount++;
    //             } else parsedGraphQLQuery = parsedGraphQLQuery.concat(char)
    //         })

    //         parsedGraphQLQuery = parsedGraphQLQuery.concat('}'.repeat(curlyBracesCount));

    //         // request new query to graphQL
    //         const document = gql`${parsedGraphQLQuery}`

    //         // console.log('parsedGraphQLQuery: ', parsedGraphQLQuery)
    //         // console.log('document: ', document)

    //         let data = await request(`${graphQlPath}`, document)
    //         console.log('data: ', data)

    //         //BUILD RESPONSE DATA OBJECT
    //         res.locals.response = data;
    //         // store data to redis
    //         // console.log('field: ', field);
    //         redis.set(field, JSON.stringify(data))
    //         // return next()

    //     }

    //     return next();
    // });

    async function createResponse() {
      // creating data array to pass to deepmerge function
      const cachedDataArr = [];

      // iterate through fieldsToCache array and check each element if stored in redis

      fieldsToCache.forEach(async (field) => {
        // console.log('field: ', field);
        // console.log(JSON.parse(field));

        //check redis if key is stored and return value
        const cachedData = JSON.parse(await redis.get(field));

        if (cachedData) {
          // console.log('cachedData: ', cachedData)
          cachedDataArr.push(cachedData);
          // console.log('chachedDataArr: ', cachedDataArr)
          console.log("if yes");
          console.log("cachedData: ", cachedData);

          // dataToReturn.data = buildDataToReturnObj(cachedData, dataToReturn);
          // dataToReturn.data = deepMerge(cachedDataArr);

          // dataToReturn.data = cachedData
          // console.log('dataToReturn: ', dataToReturn)

          // res.locals.response = cachedData;

          // return next();
        } else {
          console.log("if no");

          // create graphql query
          let parsedGraphQLQuery = `query {`;

          let curlyBracesCount = 1;

          field.split("").forEach((char) => {
            if (char === ")") {
              parsedGraphQLQuery = parsedGraphQLQuery.concat(char + "{");
              curlyBracesCount++;
            } else parsedGraphQLQuery = parsedGraphQLQuery.concat(char);
          });

          parsedGraphQLQuery = parsedGraphQLQuery.concat(
            "}".repeat(curlyBracesCount)
          );

          // request new query to graphQL
          const document = gql`
            ${parsedGraphQLQuery}
          `;

          // console.log('parsedGraphQLQuery: ', parsedGraphQLQuery)
          // console.log('document: ', document)

          let data = await request(`${graphQlPath}`, document);
          console.log("data: ", data);

          //BUILD RESPONSE DATA OBJECT
          res.locals.response = data;
          // store data to redis
          // console.log('field: ', field);
          redis.set(field, JSON.stringify(data));
          // return next()
        }
      });
      console.log("cachedDataArr: ", cachedDataArr);
      dataToReturn.data = deepMerge(cachedDataArr);
      console.log("dataToReturn: ", dataToReturn.data);
      return next();
    }
    const response = await createResponse();

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
  };
};
