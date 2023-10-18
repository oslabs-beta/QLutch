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
    data.__schema.types[0].fields.forEach((type) => {
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
        return `(${node.name.value}:${node.value.value})`;
      },
    };

    // main visitor object that builds out field array
    const visitor = {
      OperationDefinition: (node) => {
        operation = node.operation;
      },
      Field: (node) => {
        // create a var to store an current field name
        const currentField = node.name.value;

        // check if field is in typesArr
        if (typesArr.includes(currentField)) {
          // if field is first element in typesArr
          if (currentField === typesArr[0]) {
            // reassign root var with root field of first element in typesArr with arguments from visiotr function if any
            rootField = currentField;

            // check if there are args on current node and if so call argument visitor method
            if (node.arguments.length) {
              const args = visit(node, argVisitor);
              // add to main root
              rootField = rootField.concat(args.arguments[0]);
            }
          }
          // NOT DRY - CHECKING FOR ARGS TWICE
          // else re-assign currentType to current type
          // check for args
          else {
            let currentType = node.name.value;
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

    // create a var to return response data - what is difference between dataToReturn and cachedData?
    // const dataToReturn = {
    //   data: {},
    // };

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
        console.log(`merged: ${merged}`);
        res.locals.response = merged;
        return next();
      }, {});
    }

    // // creating data array to pass to deepmerge function
    // const cachedDataArr = [];
    // // iterate through fieldsToCache array and check each element if stored in redis

    //   fieldsToCache.forEach(async (field) => {
    //     //check redis if key is stored and return value
    //     const cachedData = JSON.parse(await redis.get(field));

    //     if (cachedData) {
    //       console.log("if yes");

    //       cachedDataArr.push(cachedData);

    //       console.log(`cachedDataArr: ${cachedDataArr}`);

    //       //received error saying that buildDataToReturnObj is not defined
    //       // dataToReturn.data = buildDataToReturnObj(cachedData, dataToReturn);

    //       //believe that this is from an older solution and cachedData is the newer item to pass into deepMerge
    //       // dataToReturn.data = cachedData;

    //       //saving cached data in res.locals - am only getting a response for name, not full query - probably because this is only executing once before it is returned
    //       // res.locals.response = cachedData;

    //       return next();
    //     } else {
    //       console.log("if no");

    //       // create graphql query
    //       let parsedGraphQLQuery = `query {`;

    //       let curlyBracesCount = 1;

    //       field.split("").forEach((char) => {
    //         if (char === ")") {
    //           parsedGraphQLQuery = parsedGraphQLQuery.concat(char + "{");
    //           curlyBracesCount++;
    //         } else parsedGraphQLQuery = parsedGraphQLQuery.concat(char);
    //       });

    //       parsedGraphQLQuery = parsedGraphQLQuery.concat(
    //         "}".repeat(curlyBracesCount)
    //       );

    //       // request new query to graphQL
    //       const document = gql`
    //         ${parsedGraphQLQuery}
    //       `;

    //       let data = await request(`${graphQlPath}`, document);
    //       console.log("data: ", data);

    //       //BUILD RESPONSE DATA OBJECT
    //       res.locals.response = data;
    //       // store data to redis
    //       redis.set(field, JSON.stringify(data));
    //       // return next();
    //     }
    //   });

    const cachedDataArr = [];

    const processField = async (field) => {
      const cachedData = JSON.parse(await redis.get(field));

      if (cachedData) {
        console.log("if yes");
        cachedDataArr.push(cachedData);
        // console.log(cachedDataArr);
      } else {
        console.log("if no");

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

        const document = gql`
          ${parsedGraphQLQuery}
        `;

        let data = await request(`${graphQlPath}`, document);
        console.log("data: ", data);

        res.locals.response = data;
        redis.set(field, JSON.stringify(data));
      }
    };

    const processFields = async () => {
      for (const field of fieldsToCache) {
        await processField(field);
      }
      // After all fields have been processed, call next()
      next();
    };

    // Call the function to start processing fields
    await processFields();

    // function orderOfExecution() {
    //   return next();
    // }
    // orderOfExecution();
    deepMerge(cachedDataArr);
  };
};
