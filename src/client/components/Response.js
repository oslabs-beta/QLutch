import React, { useEffect, useState } from 'react';

const Response = ({ queryResult, status }) => {

    const [time, setTime] = useState('some time');
    const [size, setSize] = useState('some size');
    const [dataOrTime, setDataOrTime] = useState('data');

    return (
        <>
            <div className='response'>
                <div className='request-button'>
                    <h2>Response</h2>
                    <div>
                        <button onClick={() => setDataOrTime('time')}>Time</button>
                        <span> / </span>
                        <button onClick={() => setDataOrTime('data')}>Data</button>
                    </div>
                </div >
                <div className='metrics'>
                    <h3 >Status: <span className='solid'>{status}</span></h3>
                    <h3 >Time: <span className='solid'>{time}</span></h3>
                    <h3 >Size: <span className='solid'>{size}</span></h3>
                </div>
                {dataOrTime === 'data' ? (
                    <div className='form'>
                        <div className='input'>
                            <textarea className='response-textarea' type='textarea' placeholder='Result...' readOnly value={queryResult}></textarea>
                        </div>
                    </div>
                ) : (
                    <div className='form'>
                        <div className='input'>
                        </div>
                    </div>
                )}

            </div>
        </>
    )
}

export default Response;