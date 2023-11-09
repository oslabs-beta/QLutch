const { request, gql } = require("graphql-request");
const { visit } = require("graphql");
const { parse } = require("graphql/language");

module.exports = function (graphQlPath, redis) {
  return async function (req, res, next) {
    try {
      console.log("---- in QLutch ---- ");

      //parse query from frontend
      const parsedQuery = parse(req.body.query);

      /*USE INTROSPECTION TO IDENTIFY SCHEMA TYPES*/

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

      //using introspection query to find all types in schema
      let schemaTypes = await request(
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

      // parsing through types with args and storing them in typesArr
      schemaTypes.__schema.types.forEach((type) => {
        if (type.name === "Query" || type.name === "Mutation") {
          type.fields.forEach((type) => {
            typesArr.push(type.name);
          });
        }
      });

      // parsing through schema types to idenitfy parent types of each field
      schemaTypes.__schema.types.forEach((type) => {
        // check if current type name is inside excluded typeArr
        if (!excludedTypeNames.includes(type.name)) {
          // if not in typeArr iterate through current field
          if (type.fields) {
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
        }
      });

      /*FIND TYPES IN CURRENT QUERY/MUTATION*/

      //checks parsedQuery for types used in query
      const findAllTypes = (query, types) => {
        const valuesObj = {};

        //helper function to traverse deeply nested query
        const traverseParsedQuery = (currentObj, visited) => {
          visited.add(currentObj);

          for (let key in currentObj) {
            const value = currentObj[key];
            //this is where the actual query types are getting stored in valuesObj
            if (types.includes(value)) {
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

        traverseParsedQuery(query, new Set());
        return valuesObj;
      };

      //returns object with all types found in query
      const valuesObj = findAllTypes(parsedQuery, typesArr);

      //the actual query types being used in the query
      const valuesArr = Object.values(valuesObj);

      // var to store the parent type for mutations
      let mutationQueryType;

      //finds query type associated with mutation
      const findMutationQueryType = (introspection, parsedQuery) => {
        const types = introspection.__schema.types;

        types.forEach((type) => {
          if (type.name === "Mutation") {
            const mutations = type.fields;
            mutations.forEach((mutation) => {
              if (valuesArr.includes(mutation.name)) {
                mutationQueryType = mutation.type.name.toLowerCase();
              }
            });
          }
        });
        return mutationQueryType;
      };

      /* VISITOR FUNCTION */

      // var to store current operation
      let operation = "";

      // var to store root field including args
      let rootField;

      // create a var to store an object of arrays
      const keysToCache = [];

      // var to store id of current query/mutation
      let id;

      // visitor object for arguments is called from field method
      const argVisitor = {
        Argument: (node) => {
          if (node.value.kind === "StringValue") {
            return `(${node.name.value}:"${node.value.value}")`;
          } else return `(${node.name.value}:${node.value.value})`;
        },
      };

      //var to store parent field in current mutation
      let mutationRootField;

      //similar to keysToCache, but instead of the query type, it includes the mutation type
      const mutationForGQLResponse = [];

      // main visitor object that builds out rootfield and mutationRootField array
      const visitor = {
        // return current operation
        OperationDefinition: (node) => {
          operation = node.operation;
        },
        // returns each query field
        Field: (node) => {
          // create a var to store an current field name
          const currentField = node.name.value;

          // check if field is in typesArr
          if (valuesArr.includes(currentField)) {
            if (operation === "mutation" && !rootField) {
              rootField = findMutationQueryType(schemaTypes, parsedQuery);
              mutationRootField = currentField;

              //sends arguments node to visitor function
              const args = visit(node, argVisitor);
              const arguments = args.arguments.map((arg) => {
                if (arg.includes("id:")) id = arg;
                return arg;
              });

              //concats id to rootField and mutationRootField - this helps normalize cache data
              rootField = rootField.concat(id);
              mutationRootField = mutationRootField.concat(id);
            } else if (currentField === valuesArr[0]) {
              // reassign root var with root field of first element in typesArr with arguments from visiotr function if any
              rootField = currentField;
              // check if there are args on current node and if so call argument visitor method
              const args = visit(node, argVisitor);
              // add to main root
              const arguments = args.arguments.map((arg) => {
                if (arg.includes("id:")) id = arg;
                return arg;
              });
              rootField = rootField.concat(id);
            } else {
              // else re-assign currentType to current type
              let currentType = node.name.value;
              if (operation === "mutation") {
                mutationRootField = mutationRootField.concat(`{${currentType}`);
              }
              rootField = rootField.concat(`{${currentType}`);
            }
          } else {
            // else add each field to root value and build out object
            if (operation === "mutation") {
              mutationForGQLResponse.push(
                mutationRootField.concat(`{${node.name.value}}`)
              );
            }
            keysToCache.push(rootField.concat(`{${node.name.value}}`));
          }
        },
      };

      //invokes initial visit function
      visit(parsedQuery, visitor);

      /* GETS RESPONSE DATA FROM CACHE OR GQL AND BUILDS OUT RESPONSE TO SEND TO FRONT END */

      //combines data found in cache and data requested from database - called in GQLResponse
      function combineCacheAndResponseData(...objects) {
        return objects.reduce((merged, obj) => {
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
                // if the property is an object, recursively merge it
                merged[key] = combineCacheAndResponseData(
                  merged[key] || {},
                  obj[key]
                );
              } else if (Array.isArray(obj[key])) {
                // if the property is an array, handle each element
                if (!merged[key]) {
                  merged[key] = [];
                }
                obj[key].forEach((el, index) => {
                  //check if the element is an object and merge it if needed
                  if (typeof el === "object" && !Array.isArray(el)) {
                    merged[key][index] = combineCacheAndResponseData(
                      merged[key][index] || {},
                      el
                    );
                  } else {
                    merged[key][index] = el;
                  }
                });
              } else {
                // otherwise, assign the value
                merged[key] = obj[key];
              }
            }
          }
          return merged;
        }, {});
      }

      //check redis if key is stored and return value - called in createResponse
      async function checkCache(key) {
        try {
          const cachedData = JSON.parse(await redis.get(key));
          return cachedData;
        } catch (err) {
          const errObj = {
            log: "error in checking cache",
            status: 400,
            message: "Invalid request",
          };
          return next(err, errObj);
        }
      }

      //checks if data is in cache or if it needs to be requested in gql
      async function createResponse() {
        try {
          //array to store non-cached keys that need to be sent to gql to request response - used in createResponse and GQLResponse
          const keysToRequestArr = [];

          // array to store cached keys - used in createResponse and GQLResponse
          const responseToMergeArr = [];

          //checks cache to see if data exists already in cache
          const checkDataIsCachedArr = keysToCache.map((key) =>
            checkCache(key)
          );

          //array with whatever data is found in the cache
          const response = await Promise.all(checkDataIsCachedArr);

          // iterates through response array and checks for values to be push to responseToMerge or keyToRequest
          for (let i = 0; i < response.length; i++) {
            if (response[i] === null) {
              keysToRequestArr.push(keysToCache[i]);
            } else {
              responseToMergeArr.push(response[i]);
            }
          }

          // getResponseAndCache writes a query and requests each field from gql, then caches responses - called in GQLResponse
          async function getResponseAndCache(key) {
            try {
              // create graphql query
              let parsedGraphQLQuery;

              if (operation === "mutation") {
                parsedGraphQLQuery = `mutation {`;
              } else {
                parsedGraphQLQuery = `query {`;
              }

              // creates a new gql object
              let curlyBracesCount = 0;

              key.split("").forEach((char) => {
                if (char === "{") curlyBracesCount++;

                parsedGraphQLQuery = parsedGraphQLQuery.concat(char);
              });

              parsedGraphQLQuery = parsedGraphQLQuery.concat(
                "}".repeat(curlyBracesCount)
              );

              // request new query to graphQL
              let document;

              if (operation === "mutation") {
                document = gql`
                  ${req.body.query}
                `;
              } else {
                document = gql`
                  ${parsedGraphQLQuery}
                `;
              }

              //requests, caches and returns response
              let gqlResponse = await request(`${graphQlPath}`, document);
              redis.set(key, JSON.stringify(gqlResponse));
              return gqlResponse;
            } catch (err) {
              const errObj = {
                log: "error in getResponse",
                status: 400,
                message: "error in getResponse",
              };
              return next(err, errObj);
            }
          }

          //ensures we cache nested mutation data
          let arrayInMutation = null;

          //iterates through mutation data from gql and builds out objects to add to cache - called in GQLResponse
          async function cacheMutations(keysToCache, response) {
            try {
              for (const key in response) {
                if (
                  typeof response[key] === "object" &&
                  !Array.isArray(response[key])
                ) {
                  cacheMutations(keysToCache, response[key]);
                } else if (Array.isArray(response[key])) {
                  arrayInMutation = key;
                  response[key].forEach((el) => {
                    if (typeof el === "object" && !Array.isArray(el)) {
                      cacheMutations(keysToCache, response[key]);
                    }
                  });
                } else {
                  for (let i = 0; i < keysToCache.length; i++) {
                    if (keysToCache[i].includes(key)) {
                      let mutationResponse;
                      //builds out properly formatted response object to cache
                      if (arrayInMutation) {
                        mutationResponse = {
                          [mutationQueryType]: {
                            [arrayInMutation]: [{ [key]: response[key] }],
                          },
                        };
                      } else {
                        mutationResponse = {
                          [mutationQueryType]: {
                            [key]: response[key],
                          },
                        };
                      }
                      //sets mutation data in redis
                      redis.set(
                        keysToCache[i],
                        JSON.stringify(mutationResponse)
                      );
                    }
                  }
                }
              }
            } catch (err) {
              const errObj = {
                log: "error in cacheMutations",
                status: 400,
                message: "error in cacheMutations",
              };
              return next(err, errObj);
            }
          }

          // requests response from gql and calls combineCacheAndResponseData to return merged object to sendResponse - called in createResponse
          async function GQLResponse() {
            if (operation === "mutation") {
              document = gql`
                ${req.body.query}
              `;
              let gqlResponse = await request(`${graphQlPath}`, document);

              cacheMutations(keysToCache, gqlResponse);

              sendResponse(gqlResponse);
            } else {
              const mergeArr = keysToRequestArr.map(
                async (key) => await getResponseAndCache(key)
              );

              const toBeMerged = await Promise.all(mergeArr);
              sendResponse(
                combineCacheAndResponseData(
                  ...toBeMerged,
                  ...responseToMergeArr
                )
              );
            }
          }

          //sends response to front end
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
          const errObj = {
            log: "sendResponse error",
            status: 400,
            message: "Invalid response",
          };
          return next(err, errObj);
        }
      }

      createResponse();
    } catch (err) {
      const errObj = {
        log: "QLutch error",
        status: 400,
        message: "Invalid request",
      };
      return next(err, errObj);
    }
  };
};
