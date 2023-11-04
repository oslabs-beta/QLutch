const redis = require("./redis");
const { request, gql } = require("graphql-request");
const { visit } = require("graphql");
const { parse } = require("graphql/language");

module.exports = function (graphQlPath) {
  return async function (req, res, next) {
    console.log("---- in QLutch ---- ");

    //parse query from frontend
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

    //using introspection que
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

    data.__schema.types.forEach((type) => {
      if (type.name === "Query" || type.name === "Mutation") {
        type.fields.forEach((type) => {
          typesArr.push(type.name);
        });
      }
    });

    // PARSING THROUGH QUERIES WITH ARGS AND STORING THEM IN TYPESARR

    // data.__schema.types[0].fields.forEach((type) => {
    //   typesArr.push(type.name);
    // });

    // console.log("data.__schema.types", data.__schema.types);

    // PARSING THROUGH EACH FIELD TO CHECK TYPEOF EXIST TO FIND TYPES INSIDE NESTED QUERY
    data.__schema.types.forEach((type) => {
      // check if current type name is inside excluded typeArr
      if (!excludedTypeNames.includes(type.name)) {
        console.log("fields", type.fields);
        // if not in typeArr iterate through current field
        if (type.fields) {
          type.fields.forEach((field) => {
            // if ofType field is truthy && it's a string && it's included in typeArr
            // console.log("field", field);
            if (
              field.type.ofType &&
              typeof field.type.ofType.name === "string" &&
              typesArr.includes(field.type.ofType.name.toLowerCase())
            ) {
              // console.log("in if conditional");
              typesArr.push(field.name);
            }
          });
        }
      }
    });
    console.log("typesArr", typesArr);
    //checks parsedQuery for types used in query
    const findAllTypes = (obj, props) => {
      const valuesObj = {};

      //helper function to traverse deeply nested query
      const traverseParsedQuery = (currentObj, visited) => {
        visited.add(currentObj);

        for (let key in currentObj) {
          const value = currentObj[key];
          //this is where the actual query types are getting stored in valuesObj
          if (props.includes(value)) {
            valuesObj[value] = value;
          }
          //if current value is an array, iterates through array to find more objects to traverse, or recursively calls traverseParsedQuery if an object is found
          if (Array.isArray(value)) {
            value.forEach((el) => {
              if (typeof el === "object" && !visited.has(el)) {
                traverseParsedQuery(el, visited);
              }
            });
          } else if (typeof value === "object" && !visited.has(value)) {
            traverseParsedQuery(value, visited);
          }
        }
      };

      traverseParsedQuery(obj, new Set());
      return valuesObj;
    };

    //returns object with all types found in query
    const valuesObj = findAllTypes(parsedQuery, typesArr);

    //the actual query types being used in the query
    const valuesArr = Object.values(valuesObj);
    // console.log("valuesArr", valuesArr);
    // Variables to store data from query received from visitor function
    let operation = "";

    // create a var to store main field with args if any
    let rootField;

    // create a var to store an object of arrays
    const keysToCache = [];

    // visitor object for arguments is called from field method in main visitor object with the input of current field node
    const argVisitor = {
      Argument: (node) => {
        // console.log('typeof node: ', typeof node.value.value)
        // console.log('node: ', node)

        if (node.value.kind === "StringValue") {
          // console.log('nodeValue:', node.value.value)
          return `(${node.name.value}:"${node.value.value}")`;
        } else return `(${node.name.value}:${node.value.value})`;
      },
    };
    //in order to not have to pass a film id in, I stored this so we could apply it to the currentField when not evaluating rootField
    let parentId;

    // main visitor object that builds out field array
    const visitor = {
      OperationDefinition: (node) => {
        operation = node.operation;
        // console.log("operation: ", operation);
      },
      Field: (node) => {
        // create a var to store an current field name
        const currentField = node.name.value;
        // console.log('currentField: ', currentField)
        // check if field is in typesArr
        if (valuesArr.includes(currentField)) {
          if (currentField === valuesArr[0]) {
            // reassign root var with root field of first element in typesArr with arguments from visiotr function if any
            rootField = currentField;
            // check if there are args on current node and if so call argument visitor method
            if (node.arguments.length) {
              const args = visit(node, argVisitor);
              // console.log('args: ', args.arguments)
              // add to main root
              //defining parentId
              parentId = args.arguments[0];
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
            rootField = rootField.concat(`{${currentType}`);
          }
        } // else add each field to root value and build out object
        else {
          keysToCache.push(rootField.concat(`{${node.name.value}}`));
        }
      },
    };
    visit(parsedQuery, visitor);
    // console.log('keysToCache: ', keysToCache)

    function deepMerge(...objects) {
      return objects.reduce((merged, obj) => {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
              // If the property is an object, recursively merge it
              merged[key] = deepMerge(merged[key] || {}, obj[key]);
            } else if (Array.isArray(obj[key])) {
              // If the property is an array, handle each element
              if (!merged[key]) {
                merged[key] = [];
              }
              obj[key].forEach((el, index) => {
                // Check if the element is an object and merge it if needed
                if (typeof el === "object" && !Array.isArray(el)) {
                  merged[key][index] = deepMerge(merged[key][index] || {}, el);
                } else {
                  merged[key][index] = el;
                }
              });
            } else {
              // Otherwise, assign the value
              merged[key] = obj[key];
            }
          }
        }
        return merged;
      }, {});
    }

    async function getCache(key) {
      try {
        //check redis if key is stored and return value
        const cachedData = JSON.parse(await redis.get(key));
        return cachedData;
      } catch (err) {
        console.log("err: ", err);
      }
    }

    const keysToRequestArr = [];

    const responseToMergeArr = [];

    async function createResponse() {
      try {
        //checks cache to see if data exists already in cache
        const checkDataIsCachedArr = keysToCache.map((key) => getCache(key));
        //array with whatever data is found in the cache
        const response = await Promise.all(checkDataIsCachedArr);
        // iterates through response array and checks for values to be push to responseToMerge or keyToRequest
        for (let i = 0; i < response.length; i++) {
          if (response[i] === null) {
            keysToRequestArr.push(keysToCache[i]);
          } else {
            responseToMergeArr.push(response[i]);
          }
          // console.log('keysToRequestArr: ', keysToRequestArr)
        }

        // get response writes a query and request each field from graphql
        async function getResponse(key) {
          // console.log('key: ', key)
          // create graphql query
          let parsedGraphQLQuery

          if(operation === "mutation") {
            parsedGraphQLQuery = `mutation {`;
          }else {
            parsedGraphQLQuery = `query {`;
          }
          let curlyBracesCount = 0;

          key.split("").forEach((char) => {
            if (char === "{") curlyBracesCount++;

            parsedGraphQLQuery = parsedGraphQLQuery.concat(char);
          });

          parsedGraphQLQuery = parsedGraphQLQuery.concat(
            "}".repeat(curlyBracesCount)
          );
          // console.log('parsedgql: ', parsedGraphQLQuery)
          // // request new query to graphQL
          const document = gql`
            ${parsedGraphQLQuery}
          `;

          let response = await request(`${graphQlPath}`, document);
          // WHERE TO SET REDIS
          redis.set(key, JSON.stringify(response));
          return response;
        }

        // request response from gql and calls deep merge to return merged object to sendResponse
        async function GQLResponse() {
          const mergeArr = keysToRequestArr.map(
            async (key) => await getResponse(key)
          );
          const toBeMerged = await Promise.all(mergeArr);
          sendResponse(deepMerge(...toBeMerged, ...responseToMergeArr));
          // console.log("toBeMerged:", toBeMerged);
          // console.log("responsetoMergeArr:", responseToMergeArr);
        }

        async function sendResponse(resObj) {
          const dataToReturn = {
            data: {},
          };
          dataToReturn.data = resObj;
          res.locals.response = dataToReturn;
          return next();
        }
        GQLResponse();
      } catch (err) {
        console.log("err: ", err);
      }
    }
    createResponse();
  };
};
