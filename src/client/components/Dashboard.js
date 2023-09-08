import React, { useState } from 'react';
import Request from './Request';
import Response from './Response';

const Dashboard = () => {

    const [text, setText] = useState('');
    const [queryResult, setQueryResult] = useState('');
    const [status, setStatus] = useState();


    const handleSubmit = (e) => {
        e.preventDefault();
        //get time of button click
        const start = new Date();
        // console.log('text:', text);
        // console.log('text stringifyed:', JSON.stringify(text));

        // requesting data from graphQL
        fetch("http://localhost:4000/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "Content-Length": 2
                
            },
            body: JSON.stringify({ query: "{ people (id: 1) {name} }" })
            // body: JSON.stringify({ query: "{ books  {title} }" }),
            // body: JSON.stringify({ query: "{ hello }" })
        })
            .then(r => {
                console.log('status: ', r.status)
                setStatus(r.status);
                return r.json()
            })
            .then(data => {
                const timeTaken = (new Date())-start;
                setQueryResult(JSON.stringify(data))
                console.log("data returned:", data, timeTaken)
            })

    }

    const handleChange = (e) => {
        setText(e.target.value);
    };

    return (
        <div>
            <h1><span className='white'>QL</span>utch</h1>
            <div className='dashboard'>
                <Request handleSubmit={handleSubmit} handleChange={handleChange} text={text} />
                <Response queryResult={queryResult} status={status} />
            </div>
        </div >
    )
}

export default Dashboard;