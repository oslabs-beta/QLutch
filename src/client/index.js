import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.scss';
import Dashboard from './components/Dashboard';



const Index = () => {
    return (
        <>
            <Dashboard />
        </>
    )
};


const root = createRoot(document.getElementById('root'))
root.render(<Index />)