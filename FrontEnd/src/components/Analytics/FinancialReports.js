import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { toast } from 'react-toastify';
import './FinancialReports.css';
import Sidebar from '../Dashboard/Sidebar';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const FinancialReports = () => {
    const [reportData, setReportData] = useState({
        incomeVsExpense: {
            labels: [],
            datasets: [{
                label: 'Income',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            },
            {
                label: 'Expenses',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        categoryWiseSpending: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1
            }]
        },
        savingsRate: {
            labels: [],
            datasets: [{
                label: 'Savings Rate %',
                data: [],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        monthlyTrends: {
            labels: [],
            datasets: [{
                label: 'Monthly Spending',
                data: [],
                fill: false,
                borderColor: 'rgb(153, 102, 255)',
                tension: 0.1
            }]
        }
    });
    const [selectedTimeframe, setSelectedTimeframe] = useState('month');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReportData();
    }, [selectedTimeframe]);

    const fetchReportData = async () => {
        try {
            const personId = localStorage.getItem('personId');
            if (!personId) {
                toast.error('Session expired. Please log in again.');
                return;
            }

            const [transactionsResponse, categoriesResponse] = await Promise.all([
                axios.get(`http://localhost:2002/TransactionHistory/person/${personId}`),
                axios.get('http://localhost:2004/category')
            ]);

            const debitCategories = categoriesResponse.data.filter(cat => cat.type === 'DEBIT');
            processReportData(transactionsResponse.data, debitCategories);
        } catch (error) {
            console.error('Error fetching report data:', error);
            toast.error('Failed to load financial reports');
        } finally {
            setLoading(false);
        }
    };

    const getTimeframeData = (transactions) => {
        const timeframeLabels = [];
        const incomeData = [];
        const expenseData = [];

        // Group transactions by month/quarter/year
        const groupedTransactions = transactions.reduce((acc, transaction) => {
            const date = new Date(transaction.date);
            let key;
            
            if (selectedTimeframe === 'month') {
                key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            } else if (selectedTimeframe === 'quarter') {
                const quarter = Math.floor(date.getMonth() / 3) + 1;
                key = `${date.getFullYear()}-Q${quarter}`;
            } else {
                key = date.getFullYear().toString();
            }

            if (!acc[key]) {
                acc[key] = { income: 0, expenses: 0 };
            }

            if (transaction.transactionType === 'CREDIT') {
                acc[key].income += transaction.amount;
            } else {
                acc[key].expenses += transaction.amount;
            }

            return acc;
        }, {});

        // Convert grouped data to arrays
        Object.entries(groupedTransactions).forEach(([label, data]) => {
            timeframeLabels.push(label);
            incomeData.push(data.income);
            expenseData.push(data.expenses);
        });

        return {
            labels: timeframeLabels,
            income: incomeData,
            expenses: expenseData
        };
    };

    const getCategoryData = (transactions, categories) => {
        const categorySpending = categories.reduce((acc, category) => {
            acc[category.categoryId] = {
                name: category.categoryName,
                amount: 0
            };
            return acc;
        }, {});

        // Sum up spending by category
        transactions.forEach(transaction => {
            if (transaction.transactionType === 'DEBIT' && transaction.categoryId) {
                if (categorySpending[transaction.categoryId]) {
                    categorySpending[transaction.categoryId].amount += transaction.amount;
                }
            }
        });

        const labels = [];
        const data = [];

        Object.values(categorySpending).forEach(category => {
            if (category.amount > 0) {
                labels.push(category.name);
                data.push(category.amount);
            }
        });

        return { labels, data };
    };

    const calculateSavingsRate = (transactions) => {
        const monthlyData = {};

        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { income: 0, expenses: 0 };
            }

            if (transaction.transactionType === 'CREDIT') {
                monthlyData[monthKey].income += transaction.amount;
            } else {
                monthlyData[monthKey].expenses += transaction.amount;
            }
        });

        const labels = [];
        const savingsRates = [];

        Object.entries(monthlyData).forEach(([month, data]) => {
            if (data.income > 0) {
                const savingsRate = ((data.income - data.expenses) / data.income) * 100;
                labels.push(month);
                savingsRates.push(Math.max(0, savingsRate.toFixed(2)));
            }
        });

        return { labels, data: savingsRates };
    };

    const calculateTrends = (transactions) => {
        const monthlySpending = {};

        transactions.forEach(transaction => {
            if (transaction.transactionType === 'DEBIT') {
                const date = new Date(transaction.date);
                const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

                if (!monthlySpending[monthKey]) {
                    monthlySpending[monthKey] = 0;
                }

                monthlySpending[monthKey] += transaction.amount;
            }
        });

        const labels = Object.keys(monthlySpending);
        const data = Object.values(monthlySpending);

        return { labels, data };
    };

    const processReportData = (transactions, categories) => {
        const timeframeData = getTimeframeData(transactions);
        const categoryData = getCategoryData(transactions, categories);
        const savingsData = calculateSavingsRate(transactions);
        const trendData = calculateTrends(transactions);

        setReportData(prev => ({
            ...prev,
            incomeVsExpense: {
                labels: timeframeData.labels,
                datasets: [
                    {
                        ...prev.incomeVsExpense.datasets[0],
                        data: timeframeData.income
                    },
                    {
                        ...prev.incomeVsExpense.datasets[1],
                        data: timeframeData.expenses
                    }
                ]
            },
            categoryWiseSpending: {
                labels: categoryData.labels,
                datasets: [{
                    ...prev.categoryWiseSpending.datasets[0],
                    data: categoryData.data
                }]
            },
            savingsRate: {
                labels: savingsData.labels,
                datasets: [{
                    ...prev.savingsRate.datasets[0],
                    data: savingsData.data
                }]
            },
            monthlyTrends: {
                labels: trendData.labels,
                datasets: [{
                    ...prev.monthlyTrends.datasets[0],
                    data: trendData.data
                }]
            }
        }));
    };

    if (loading) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <div className="dashboard-content">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-content">
                <div className="reports-container">
                    <div className="reports-header">
                        <h2>Financial Reports & Analytics</h2>
                        <div className="timeframe-selector">
                            <button 
                                className={`timeframe-btn ${selectedTimeframe === 'month' ? 'active' : ''}`}
                                onClick={() => setSelectedTimeframe('month')}
                            >
                                Monthly
                            </button>
                            <button 
                                className={`timeframe-btn ${selectedTimeframe === 'quarter' ? 'active' : ''}`}
                                onClick={() => setSelectedTimeframe('quarter')}
                            >
                                Quarterly
                            </button>
                            <button 
                                className={`timeframe-btn ${selectedTimeframe === 'year' ? 'active' : ''}`}
                                onClick={() => setSelectedTimeframe('year')}
                            >
                                Yearly
                            </button>
                        </div>
                    </div>

                    <div className="reports-grid">
                        <div className="report-card">
                            <h3>Income vs Expenses</h3>
                            <div className="chart-container">
                                <Bar 
                                    data={reportData.incomeVsExpense}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: {
                                                beginAtZero: true
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="report-card">
                            <h3>Category-wise Spending</h3>
                            <div className="chart-container">
                                <Doughnut 
                                    data={reportData.categoryWiseSpending}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false
                                    }}
                                />
                            </div>
                        </div>

                        <div className="report-card">
                            <h3>Savings Rate</h3>
                            <div className="chart-container">
                                <Line 
                                    data={reportData.savingsRate}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                max: 100
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="report-card">
                            <h3>Monthly Trends</h3>
                            <div className="chart-container">
                                <Line 
                                    data={reportData.monthlyTrends}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: {
                                                beginAtZero: true
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialReports;