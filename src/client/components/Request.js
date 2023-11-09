import React, { useState } from 'react';
import Response from './Response';
import bytes from 'bytes';

export default function Request() {

    const [queryResult, setQueryResult] = useState('');
    const [status, setStatus] = useState('');
    const [time, setTime] = useState();
    const [size, setSize] = useState();

    function getQueryResult() {

        // Get time of button click
        const start = new Date();
        const query = document.getElementById("queryInput").value
        let byteSize = 0;
        console.log(query)
        // console.warn(xhr.responseText);
        // Requesting data from GraphQL
        fetch("http://localhost:4000/qlutch", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },

            // body: JSON.stringify(document.getElementById("queryInput").value)
            body: JSON.stringify({ query })
            // body: JSON.stringify({ query: "{ person (id: 1) {name height hair_color films (id: 5) { title } } }" })
        })
            .then((response) => {
                setStatus(response.status);
                byteSize += bytes.parse(JSON.stringify(response.headers).length);
                return response.json()
            })
            .then((data) => {
                byteSize += bytes.parse(JSON.stringify(data.data).length);
                setTime((new Date()) - start);
                setSize(bytes.format(byteSize));
                setQueryResult(JSON.stringify(data));
            })
            .catch((err) => {
                console.log(err);
            })
    }

    // Function to clear the Redis cache
    const handleClearCache = () => {
        fetch("http://localhost:4000/badCacheReset");
    }

    return (
        <>
            <div className="request">
                <h2>Request</h2>
                <div className="form">
                    <div className="input lower">
                        <textarea
                            id="queryInput"
                            name='queryInput'
                            className="input-textarea"
                            type="textarea"
                            placeholder="Enter query here..."
                        //added this for developing purposes - don't forget to remove!!
                        // value="{ person (id: 1) {name height hair_color films (id: 5) { title } } }"
                        />
                        <div className="input-buttons">
                            <button
                                className="button"
                                id="cache-button"
                                onClick={handleClearCache}
                            >
                                Clear Cache
                            </button>
                            <button
                                className="button"
                                onClick={getQueryResult}
                            >
                                Run
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <Response
                queryResult={queryResult}
                status={status}
                time={time}
                size={size}
            />
        </>
    )
};