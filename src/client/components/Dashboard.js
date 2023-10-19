import React, { useState } from 'react';
import { request, gql } from 'graphql-request'
import Request from './Request';
import Response from './Response';
import bytes from 'bytes';

const Dashboard = () => {

    const [text, setText] = useState('');
    const [queryResult, setQueryResult] = useState('');
    const [status, setStatus] = useState();
    const [time, setTime] = useState();
    const [size, setSize] = useState();

    console.log(text);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // get time of button click
        const start = new Date();
        let byteSize = 0;


        // requesting data from graphQL
        fetch("http://localhost:4000/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                // "Content-Length": 2

            },
            body: JSON.stringify({ query: "{ person (id: 1) {name  hair_color films (id: 5) { title } } }" })
            // body: JSON.stringify({ query: "{ person (id:1)  { name hair_color} }" }),
            // body: JSON.stringify({ query: "{ hello }" })
        })
            .then(r => {
                console.log('r: ', r)
                setStatus(r.status);
                // console.log(r.headers.get("Content-Length"))
                byteSize += bytes.parse(JSON.stringify(r.headers).length);
                return r.json()
            })
            .then(data => {
                console.log('data: ', data)
                byteSize += bytes.parse(JSON.stringify(data.data).length);
                setTime((new Date()) - start);
                setSize(bytes.format(byteSize));
                setQueryResult(JSON.stringify(data))
            })


        /* REQUEST WITH GRAPHQL REQUEST */
        // const document = gql`
        //     query {
        //         person(id:"1") {
        //          name
        //          }
        //         }
        //     `

        // const response = await request('http://localhost:4000/graphql', document)
        // console.log(response)
    }

    const handleChange = (e) => {
        setText(e.target.value);
    };

    return (
        <div>
            <h1><span className='white'>QL</span>utch</h1>
            <div className='dashboard'>
                <Request handleSubmit={handleSubmit} handleChange={handleChange} text={text} />
                <Response queryResult={queryResult} status={status} time={time} size={size} />
            </div>
        </div >
    )
}

export default Dashboard;