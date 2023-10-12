import React, { useState } from 'react';
import Request from './Request';
import Response from './Response';
import bytes from 'bytes';

// const queryInput = document.getElementById('queryInput');
const q = "{ person (id: 1) {name hair_color} }"

const Dashboard = (props) => {
    console.log('props: ', props);

    const [text, setText] = useState('');
    const [queryResult, setQueryResult] = useState('');
    const [status, setStatus] = useState();
    const [time, setTime] = useState();
    const [size, setSize] = useState();


    const handleSubmit = (e) => {
        e.preventDefault();
        //get time of button click
        const start = new Date();
        let byteSize = 0;
       
        console.log('text: ', text);
        // requesting data from graphQL
        fetch("http://localhost:4000/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                // "Content-Length": 2

            },
            // body: JSON.stringify({ query: "{ people (id: 1) {name} }" })
            // body: JSON.stringify({ query: "{ person (id: 1) {name hair_color} }" })
            body: JSON.stringify({ query:  q})
            
            // body: JSON.stringify({ query: "{ books  {title} }" }),
            // body: JSON.stringify({ query: "{ hello }" })
        })
            .then(r => {
                setStatus(r.status);
                // console.log(r.headers.get("Content-Length"))
                byteSize += bytes.parse(JSON.stringify(r.headers).length);
                return r.json()
            })
            .then(data => {
                byteSize += bytes.parse(JSON.stringify(data.data).length);
                setTime((new Date()) - start);
                setSize(bytes.format(byteSize));
                setQueryResult(JSON.stringify(data))
            })

    }

    const handleChange = (e) => {
        setText(e.target.value);
    };

    return (
        <div>
            <h1><span className='white'>QL</span>utch</h1>
            <div className='dashboard'>
                {/* <Request handleSubmit={handleSubmit} handleChange={handleChange} text={text} /> */}
                <Request handleSubmit={handleSubmit} handleChange={handleChange} text={text} />
                <Response queryResult={queryResult} status={status} time={time} size={size}/>
            </div>
        </div >
    )
}

export default Dashboard;