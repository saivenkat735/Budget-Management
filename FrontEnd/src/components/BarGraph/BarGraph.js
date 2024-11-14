import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const BarGraph = ({ data = { labels: [], income: [], expenses: [] }, title = 'Chart' }) => {
    const chartData = {
        labels: data.labels,
        datasets: [
            {
                label: 'Income',
                data: data.income,
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
                borderColor: '#10b981',
                borderWidth: 1,
                borderRadius: 4,
                barThickness: 20
            },
            {
                label: 'Expenses',
                data: data.expenses,
                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                borderColor: '#ef4444',
                borderWidth: 1,
                borderRadius: 4,
                barThickness: 20
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    boxWidth: 15,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif"
                    }
                }
            },
            title: {
                display: true,
                text: title,
                font: {
                    size: 16,
                    family: "'Inter', sans-serif",
                    weight: '500'
                },
                padding: {
                    top: 10,
                    bottom: 30
                },
                color: '#111827'
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif"
                    },
                    color: '#6b7280'
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: '#f3f4f6'
                },
                ticks: {
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif"
                    },
                    color: '#6b7280',
                    callback: function(value) {
                        return '₹' + value.toLocaleString();
                    }
                }
            }
        }
    };

    return (
        <div className="bar-graph-container">
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default BarGraph;
