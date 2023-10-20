import React from 'react';
import Request from './Request';

export default function Dashboard() {
    return (
        <div>
            <h1>
                <span className='white'>QL</span>utch
            </h1>
            <div className='dashboard'>
                <Request />
            </div>
        </div>
    )
};