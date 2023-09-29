import React, { useState, useEffect, useRef } from "react";
import Chart from "react-apexcharts";


export default function BarChart({time}) {

    // const newTime = [time]
    // console.log('time: ', [...newTime, time]);
    // const firstUpdate = useRef(true);
    
    const [newTime, setNewTime] = useState([])
    const [counter, setCounter] = useState([]);
    const [i, setI] = useState(1);
    
    
    const series = [{
        // push time to data array
        data: newTime
    }]
    useEffect(() => {
        console.log('newTime: ', newTime)
        if (time) {
            setI(i + 1);
            setNewTime([...newTime, time])
            setCounter([...counter, `${i} Call`])
        }
    }, [time])


    const options = { //data on the x-axis
        // chart: { id: 'donut' },
        xaxis: {
            // create for looop for calls number
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
        toolbar : {
            show: false
        }
    }

    // console.log(options);

    // let i = 0;
    // if (time) {
    //     i++;
    //     series[0].data.push(time);
    //     console.log('series: ',series[0].data )
    //     options.xaxis.categories.push(i);
    // }


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


// const BudgetChart = ({ totalBudget, sumTrans, transactions }) => {
//     const [chartvals, setChartvals] = useState({
//       chart: {
//         type: 'line',
//           width: 600,
//           height:400,
//           dataLabels:{
//               position:'bottom',
//               align:'right'
//           }
  
//           // redrawOnParentResize: true
//       },
//       dataLabels: {
//         enabled: false,
//       },
//       legend: {
//           show: false,
//           position: 'bottom'
//       },
//       stroke: {
//         curve: 'smooth',
//       },
//       series: [
//         {
//           name: 'cumulative',
//           data: [], // Will be filled with cumulative transaction data
//         },
//         {
//           name: 'daily',
//           data: [], // Will be filled with daily transaction data
//         },
//         {
//           name: 'budget',
//           data: [totalBudget, totalBudget, totalBudget],
//         },
  
//       ],
//       colors:['#1E9700', '#CCFF79', '#FC6238'],
//       // fill:{
//       //     type:'gradient',
//       //     gradient:{
//       //         shadeIntensity:1,
//       //         opacityfrom:0.7,
//       //         opacityTo:0.9,
//       //         colorStops:function(data){
//       //                 return data.map((d,idx))=>{
//       //                     let color=d>0?'#22c55f':'#ef4544';
//       //                     return{
//       //                         offset:idx/data.length*100
//       //                     }
//       //                 }
//       //         }
//       //     }
//       // },
//       xaxis: {
//         categories: [], // Will be filled with dates
//         type: 'datetime',
//         tickAmount:9,
//         labels:{
//           formatter:function(val,timestamp,opts){
//               return opts.dateFormatter(new Date(timestamp),'dd MMM')
//           }
//         }
//       },
//       yaxis: {
//         axisTicks: {
//           show: true,
//         },
//         axisBorder: {
//           show: true,
//         },
//       },
//     });