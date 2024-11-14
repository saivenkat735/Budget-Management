import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import './Portfolio.css';

const Portfolio = () => {
    const [investments, setInvestments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newInvestment, setNewInvestment] = useState({
        type: '',
        amount: '',
        description: '',
        startDate: '',
        expectedReturn: ''
    });
    const [portfolioStats, setPortfolioStats] = useState({
        totalInvestment: 0,
        totalReturns: 0,
        performancePercentage: 0
    });

    useEffect(() => {
        fetchInvestments();
    }, []);

    const fetchInvestments = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const decodedToken = jwtDecode(token);
            const response = await axios.get(
                `http://localhost:2004/investments/person/${decodedToken.personId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setInvestments(response.data);
            calculatePortfolioStats(response.data);
        } catch (error) {
            console.error('Error fetching investments:', error);
            toast.error('Failed to load investment portfolio');
        }
    };

    const calculatePortfolioStats = (investments) => {
        const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);
        const totalReturns = investments.reduce((sum, inv) => sum + (inv.currentValue || inv.amount), 0);
        const performancePercentage = totalInvestment === 0 ? 0 : 
            ((totalReturns - totalInvestment) / totalInvestment) * 100;

        setPortfolioStats({
            totalInvestment,
            totalReturns,
            performancePercentage
        });
    };

    const chartData = {
        labels: investments.map(inv => inv.type),
        datasets: [{
            data: investments.map(inv => inv.amount),
            backgroundColor: [
                '#4f46e5',
                '#10b981',
                '#f59e0b',
                '#ef4444',
                '#8b5cf6',
                '#ec4899'
            ],
            borderWidth: 1
        }]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const value = context.raw;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `₹${value.toLocaleString()} (${percentage}%)`;
                    }
                }
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('authToken');
            const decodedToken = jwtDecode(token);
            
            await axios.post(
                'http://localhost:2004/investments',
                {
                    ...newInvestment,
                    personId: decodedToken.personId,
                    amount: parseFloat(newInvestment.amount),
                    expectedReturn: parseFloat(newInvestment.expectedReturn)
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            toast.success('Investment added successfully');
            setShowModal(false);
            fetchInvestments();
            resetForm();
        } catch (error) {
            console.error('Error adding investment:', error);
            toast.error('Failed to add investment');
        }
    };

    const resetForm = () => {
        setNewInvestment({
            type: '',
            amount: '',
            description: '',
            startDate: '',
            expectedReturn: ''
        });
    };

    return (
        <div className="portfolio-container">
            <div className="portfolio-header">
                <h2>Investment Portfolio</h2>
                <button 
                    className="add-investment-btn"
                    onClick={() => setShowModal(true)}
                >
                    Add Investment
                </button>
            </div>

            <div className="portfolio-stats">
                <div className="stat-card">
                    <h3>Total Investment</h3>
                    <p>₹{portfolioStats.totalInvestment.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                    <h3>Current Value</h3>
                    <p>₹{portfolioStats.totalReturns.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                    <h3>Performance</h3>
                    <p className={portfolioStats.performancePercentage >= 0 ? 'positive' : 'negative'}>
                        {portfolioStats.performancePercentage >= 0 ? '+' : ''}
                        {portfolioStats.performancePercentage.toFixed(2)}%
                    </p>
                </div>
            </div>

            <div className="portfolio-content">
                <div className="chart-section">
                    <h3>Portfolio Distribution</h3>
                    <div className="chart-container">
                        <Pie data={chartData} options={chartOptions} />
                    </div>
                </div>

                <div className="investments-list">
                    <h3>Investment Details</h3>
                    {investments.map(investment => (
                        <div key={investment.id} className="investment-card">
                            <div className="investment-header">
                                <h4>{investment.type}</h4>
                                <span className="investment-amount">
                                    ₹{investment.amount.toLocaleString()}
                                </span>
                            </div>
                            <div className="investment-details">
                                <p>{investment.description}</p>
                                <div className="investment-metrics">
                                    <span>Expected Return: {investment.expectedReturn}%</span>
                                    <span>Start Date: {new Date(investment.startDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Add New Investment</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Investment Type</label>
                                <select
                                    value={newInvestment.type}
                                    onChange={(e) => setNewInvestment({
                                        ...newInvestment,
                                        type: e.target.value
                                    })}
                                    required
                                >
                                    <option value="">Select Type</option>
                                    <option value="Stocks">Stocks</option>
                                    <option value="Mutual Funds">Mutual Funds</option>
                                    <option value="Fixed Deposits">Fixed Deposits</option>
                                    <option value="Real Estate">Real Estate</option>
                                    <option value="Cryptocurrency">Cryptocurrency</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Amount</label>
                                <input
                                    type="number"
                                    value={newInvestment.amount}
                                    onChange={(e) => setNewInvestment({
                                        ...newInvestment,
                                        amount: e.target.value
                                    })}
                                    required
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newInvestment.description}
                                    onChange={(e) => setNewInvestment({
                                        ...newInvestment,
                                        description: e.target.value
                                    })}
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    value={newInvestment.startDate}
                                    onChange={(e) => setNewInvestment({
                                        ...newInvestment,
                                        startDate: e.target.value
                                    })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Expected Return (%)</label>
                                <input
                                    type="number"
                                    value={newInvestment.expectedReturn}
                                    onChange={(e) => setNewInvestment({
                                        ...newInvestment,
                                        expectedReturn: e.target.value
                                    })}
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="submit-btn">
                                    Add Investment
                                </button>
                                <button 
                                    type="button" 
                                    className="cancel-btn"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Portfolio; 