import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import './FinancialReports.css';

const FinancialReports = () => {
    const [reportData, setReportData] = useState({
        incomeVsExpense: {
            labels: [],
            income: [],
            expenses: []
        },
        categoryWiseSpending: {
            labels: [],
            data: []
        },
        savingsRate: {
            labels: [],
            data: []
        },
        monthlyTrends: {
            labels: [],
            data: []
        }
    });
    const [selectedTimeframe, setSelectedTimeframe] = useState('month');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReportData();
    }, [selectedTimeframe]);

    const fetchReportData = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const decodedToken = jwtDecode(token);

            const [transactionsResponse, categoriesResponse] = await Promise.all([
                axios.get('http://localhost:2002/TransactionHistory', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                axios.get('http://localhost:2004/category', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            processReportData(transactionsResponse.data, categoriesResponse.data);
        } catch (error) {
            console.error('Error fetching report data:', error);
            toast.error('Failed to load financial reports');
        } finally {
            setLoading(false);
        }
    };

    const processReportData = (transactions, categories) => {
        // Process data for different charts based on selectedTimeframe
        const timeframeData = getTimeframeData(transactions);
        const categoryData = getCategoryData(transactions, categories);
        const savingsData = calculateSavingsRate(transactions);
        const trendData = calculateTrends(transactions);

        setReportData({
            incomeVsExpense: timeframeData,
            categoryWiseSpending: categoryData,
            savingsRate: savingsData,
            monthlyTrends: trendData
        });
    };

    const getTimeframeData = (transactions) => {
        // Implementation for income vs expense over time
        // Return processed data for Bar chart
    };

    const getCategoryData = (transactions, categories) => {
        // Implementation for category-wise spending
        // Return processed data for Doughnut chart
    };

    const calculateSavingsRate = (transactions) => {
        // Implementation for savings rate calculation
        // Return processed data for Line chart
    };

    const calculateTrends = (transactions) => {
        // Implementation for monthly trends
        // Return processed data for Line chart
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading financial reports...</p>
            </div>
        );
    }

    return (
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
                                // Additional chart options...
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
                                maintainAspectRatio: false,
                                // Additional chart options...
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
                                // Additional chart options...
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
                                // Additional chart options...
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialReports; 