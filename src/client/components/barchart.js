import React, { useState, useEffect, useRef } from "react";
import Chart from "react-apexcharts";


export default function BarChart({ time }) {

    const [newTime, setNewTime] = useState([])
    const [counter, setCounter] = useState([]);
    const [i, setI] = useState(1);


    const series = [{
        data: newTime
    }]
    useEffect(() => {
        if (time) {
            setI(i + 1);
            setNewTime([...newTime, time])
            setCounter([...counter, `${i} Call`])
        }
    }, [time])


    const options = {
        xaxis: {
            categories: counter
        },
        colors: ['#FFCFA3'],
        dataLabels: {
            enabled: false,
        },
        plotOptions: {
            bar: {
                horizontal: true
            }
        },
        toolbar: {
            show: false
        }
    }


    return (
        <div className="chart">
            <Chart
                options={options}
                series={series}
                type="bar"
                width="100%"
                height="380"
            />
        </div >
    )
}

