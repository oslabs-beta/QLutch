import React, { useState } from 'react';
import Request from './Request';
import Response from './Response';

const Dashboard = () => {

    const [text, setText] = useState('');
    const [queryResult, setQueryResult] = useState('');


    const handleSubmit = (e) => {
        e.preventDefault();

        // console.log('text:', JSON.stringify(text).split(' '));
        // console.log('text:', text.split(' '));
        // console.log('text stringifyed:', JSON.stringify(text));

        // requesting data from graphQL
        fetch("http://localhost:4000/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            // body: JSON.stringify({ query: "{ people (id: 1) {name} }" }),
            body: JSON.stringify({ query: "{ books  {title} }" }),
        })
            .then(r => r.json())
            .then(data => {
                setQueryResult(JSON.stringify(data))
                console.log("data returned:", data)
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
                <Response queryResult={queryResult} />
            </div>
        </div >
    )
}

export default Dashboard;