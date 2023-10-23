const redis = require("./redis");
const { request, gql } = require("graphql-request");
const { visit } = require("graphql");
const { parse } = require("graphql/language");
const { Person, Film } = require("./database");

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

    // create a var to store main field with args if any
    let rootField;

    // create a var to store an object of arrays
    const keysToCache = [];

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
          keysToCache.push(rootField.concat(node.name.value));
        }
      },
    };

    visit(parsedQuery, visitor);

    function deepMerge(...objects) {
      return objects.reduce((merged, obj) => {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
              // If the property is an object, recursively merge it
              merged[key] = deepMerge(merged[key] || {}, obj[key]);
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
        const checkDataIsCachedArr = keysToCache.map((key) => getCache(key));
        const response = await Promise.all(checkDataIsCachedArr);
        // iterates through response array and checks for values to be push to responseToMerge or keyToRequest
        for (let i = 0; i < response.length; i++) {
          if (response[i] === null) {
            keysToRequestArr.push(keysToCache[i]);
          } else {
            responseToMergeArr.push(response[i]);
          }
        }

        // get response writes a query and request each field from graphql
        async function getResponse(key) {
          // keysToRequestArr.forEach(async (key) => {

          // create graphql query
          let parsedGraphQLQuery = `query {`;
          let curlyBracesCount = 1;

          key.split("").forEach((char) => {
            if (char === ")") {
              parsedGraphQLQuery = parsedGraphQLQuery.concat(char + "{");
              curlyBracesCount++;
            } else parsedGraphQLQuery = parsedGraphQLQuery.concat(char);
          });

          parsedGraphQLQuery = parsedGraphQLQuery.concat(
            "}".repeat(curlyBracesCount)
          );

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
        async function GGQLResponse() {
          const mergeArr = keysToRequestArr.map(
            async (key) => await getResponse(key)
          );
          const toBeMerged = await Promise.all(mergeArr);
          sendResponse(deepMerge(...toBeMerged, ...responseToMergeArr));
        }

        async function sendResponse(resObj) {
          // create a var to return response data
          const dataToReturn = {
            data: {},
          };
          dataToReturn.data = resObj;

          //if data check is empty array, that means the person we're querying for does not exist in the database yet
          const dataCheck = await Person.find({
            name: dataToReturn.data.person.name,
          });
          if (dataCheck.length === 0) {
            //store person data in the database
            await Person.create({
              name: dataToReturn.data.person.name,
              height: dataToReturn.data.person.height,
              hair_color: dataToReturn.data.person.hair_color,
              films: dataToReturn.data.person.films,
            });
          }
          res.locals.response = dataToReturn;
          return next();
        }
        GGQLResponse();
      } catch (err) {
        console.log("err: ", err);
      }
    }
    createResponse();
  };
};
