const { visit } = require('graphql')
const { parse } = require('graphql/language')



// const parser = {};

module.exports = function (req, res, next) {
    console.log('parseController.visit', req.body.query)

    const query = req.body.query

    const queryToCache = {};

    const visitor = {
        // Name: (node) => {
        //     console.log('Name: ', node.value)
        // },
        Field: (node) => {
            console.log('Field: ', node.name.value)
        },
        OperationDefinition: (node) => {
            console.log('Operation: ', node.operation)
        },
        Argument: (node) => {
            console.log('Argument: ', node.name.value)
            console.log('Argument: ', node.value.value)
        },
    };

    visit(parse(query), visitor)

    return next();
}







// const query = `
//   query {
//     viewer(id: "1")  {
//       username
//       email
//       age
//     }
//   }
// `

// const query = `
//     query {
//         people(id: 5) {
//           name
//         }
//       }
// `


// const query = JSON.stringify({ query: "{ people (id: 1) { name } }" })

// function hash(input) {
//     let hash = 0;
//     for (let i = 0; i < input.length; i++) {
//         const char = input.charCodeAt(i);
//         hash = (hash << 5) - hash + char;
//     }
//     return hash;
// }

// const hashValue = hash(query);
// console.log(`Hash value: ${hashValue}`);



// var indent = ''
// var visitor = {
//     enter(node) {
//         console.log(node.name)
//         // console.log(`${indent}Enter ${node.kind}`)
//         indent = indent + '  '
//     },
//     leave(node) {
//         indent = indent.substring(0, indent.length - 2)
//         console.log(`${indent}Leave ${node.kind}`)
//     }
// }


// const visitor = {
//     Name: (node) => {
//         console.log(node.value)
//     },
//     Field: (node) => {
//         console.log(node.name.value)
//     },
//     OperationDefinition: (node) => {
//         console.log(node.operation)
//     },
//     Argument: (node) => {
//         console.log(node.name.value)
//         console.log(node.value.value)
//     },
// };



// console.log(visit(parse(query), visitor))

// const parsedQuery = parse(query);

// console.log(parsedQuery)
// console.log(parsedQuery.definitions[0].operation)
// console.log(parsedQuery.definitions[0].selectionSet.selections[0].name.value)
// console.log(parsedQuery.definitions[0].selectionSet.selections[0].selectionSet.selections[0].name.value)
// console.log(parsedQuery.definitions[0].selectionSet.selections[0].arguments[0].value.value)
// console.log(parsedQuery.definitions[0].selectionSet.selections[0].selectionSet.selections[1].name.value)
// console.log(parsedQuery.definitions[0].selectionSet.selections[0].selectionSet.selections[2].name.value)