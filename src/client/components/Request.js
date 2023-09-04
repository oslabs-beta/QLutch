import React, { useState } from 'react';

const Request = ({ handleSubmit, handleChange, text }) => {

    
    const handleClearCache = () => {
        console.log('handle cache')
    }


    return (
        <>
            <div className='request'>
                <h2>Request</h2>
                <form method="post" onSubmit={handleSubmit} className='form'>
                    <div className='input lower'>
                        <textarea className='input-textarea' type='textarea' placeholder='Enter query here....' onChange={handleChange} ></textarea>
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