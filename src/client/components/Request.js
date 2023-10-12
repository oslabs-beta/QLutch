import React, { useState } from 'react';

const Request = ({ handleSubmit, handleChange, text }) => {

    // const [queryInput, setQueryInput] = useState('');

    // const handleQueryChange = event => {
    //     setQueryInput(event.target.value);
    //     console.log(event.target.value);
    // };
    
    const handleClearCache = () => {
        console.log('Requesting Cache Flush');
        fetch("http://localhost:4000/badCacheReset");
    }


    return (
        <>
            <div className='request'>
                <h2>Request</h2>
                <form method="post" onSubmit={handleSubmit} className='form'>
                    <div className='input lower'>
                        <label htmlFor="queryInput">My Textarea</label>
                        <textarea 
                            id='queryInput'
                            name='queryInput'
                            // value={queryInput}
                            defaultValue={text}
                            className='input-textarea' 
                            // onChange={handleQueryChange}
                            type='textarea' 
                            placeholder='Enter query here....' 
                            // onChange={handleChange} 
                        />
                        <div className='input-buttons'>
                            <button className='button' id='cache-button' type='button' onClick={handleClearCache}>Clear Cache</button>
                            <button className='button' type='submit'>Run</button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    )
}

export default Request;