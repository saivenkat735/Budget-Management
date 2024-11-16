import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FaWallet, FaMoneyBill, FaChartLine } from 'react-icons/fa';
import './Dashboard.css';
import Sidebar from './Sidebar';
import axios from 'axios';

const Dashboard = () => {
    const { user } = useAuth();
    
    const [dashboardData, setDashboardData] = useState({
        accounts: [],
        totalBalance: 0,
        fixedExpenses: 0,
        availableBalance: 0,
        recentTransactions: [],
        upcomingBills: [],
        userName: user?.username || 'User',
        userEmail: user?.email || 'example@email.com'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initializeDashboard = async () => {
            try {
                const personId = localStorage.getItem('personId');
                console.log('PersonId from localStorage:', personId);

                if (!personId) {
                    setError('Session expired. Please log in again.');
                    setLoading(false);
                    return;
                }

                await fetchDashboardData(personId);
                
            } catch (err) {
                console.error('Dashboard initialization error:', err);
                setError('Failed to load your financial data');
                setLoading(false);
            }
        };

        initializeDashboard();
    }, []);

    const fetchDashboardData = async (personId) => {
        try {
            setLoading(true);
            setError(null);

            if (!personId) {
                throw new Error('Authentication required');
            }

            // Fetch all data in parallel
            const [accountsResponse, billsResponse, transactionsResponse] = await Promise.all([
                axios.get(`http://localhost:2001/api/accounts/person/${personId}`),
                axios.get(`http://localhost:9007/bills/person/${personId}`),
                axios.get(`http://localhost:2002/TransactionHistory/person/${personId}`)
            ]);

            // Validate the data received
            if (!accountsResponse.data || !Array.isArray(accountsResponse.data)) {
                throw new Error('Unable to fetch account information');
            }

            // Filter out inactive accounts and calculate total balance
            const activeAccounts = accountsResponse.data.filter(acc => acc.active);
            const totalBalance = activeAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

            // Filter out paid bills and calculate fixed expenses only for unpaid bills
            const allBills = billsResponse.data || [];
            const unpaidBills = allBills.filter(bill => !bill.paid);
            const fixedExpenses = unpaidBills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);

            // Get upcoming bills (within the next 30 days) that are not paid
            const today = new Date();
            const thirtyDaysFromNow = new Date(today.setDate(today.getDate() + 30));
            const upcomingBills = unpaidBills
                .filter(bill => new Date(bill.dueDate) <= thirtyDaysFromNow)
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

            const availableBalance = totalBalance - fixedExpenses;

            // Sort transactions by transactionId in descending order and take top 5
            const sortedTransactions = transactionsResponse.data
                .sort((a, b) => b.transactionId - a.transactionId)
                .slice(0, 5);

            // Map transactions with account names
            const transactionsWithAccounts = sortedTransactions.map(transaction => {
                const account = activeAccounts.find(acc => acc.accountId === transaction.accountId);
                return {
                    ...transaction,
                    accountName: account ? account.accountName : 'Unknown Account'
                };
            });

            // Update dashboard data
            setDashboardData(prev => ({
                ...prev,
                accounts: activeAccounts,
                totalBalance,
                fixedExpenses,
                availableBalance,
                upcomingBills,
                recentTransactions: transactionsWithAccounts || [],
            }));

            setLoading(false);
        } catch (error) {
            console.error('Dashboard data fetch error:', error);
            setError(error.message || 'Failed to load dashboard data');
            toast.error('Unable to fetch your financial data. Please try again.');
            setLoading(false);
        }
    };

    const handleRetry = async () => {
        const personId = localStorage.getItem('personId');
        if (personId) {
            await fetchDashboardData(personId);
        } else {
            toast.error('Please log in again to continue');
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar userName={dashboardData.userName} userEmail={dashboardData.userEmail} />
            <div className="dashboard-content">
                {error ? (
                    <div className="error-container">
                        <h3>Unable to Load Dashboard</h3>
                        <p>{error}</p>
                        <button 
                            className="retry-button"
                            onClick={handleRetry}
                        >
                            Retry Loading
                        </button>
                    </div>
                ) : loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Fetching your financial data...</p>
                    </div>
                ) : (
                    <div className="dashboard-container">
                        <div className="dashboard-header">
                            <h2>Welcome back, {dashboardData.userName}!</h2>
                            <p>Here's your financial snapshot</p>
                        </div>

                        <div className="balance-overview">
                            <div className="balance-card total">
                                <div className="balance-icon">
                                    <FaWallet />
                                </div>
                                <div className="balance-info">
                                    <h3>Total Balance</h3>
                                    <p>₹{dashboardData.totalBalance.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="balance-card expenses">
                                <div className="balance-icon">
                                    <FaMoneyBill />
                                </div>
                                <div className="balance-info">
                                    <h3>Fixed Expenses</h3>
                                    <p>₹{dashboardData.fixedExpenses.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="balance-card available">
                                <div className="balance-icon">
                                    <FaChartLine />
                                </div>
                                <div className="balance-info">
                                    <h3>Available Balance</h3>
                                    <p>₹{dashboardData.availableBalance.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="accounts-section">
                            <h3>Your Accounts</h3>
                            <div className="accounts-grid">
                                {dashboardData.accounts.map(account => (
                                    <div 
                                        key={account.accountId} 
                                        className="account-card"
                                    >
                                        <div className="account-info">
                                            <h4>{account.accountName}</h4>
                                            <span className="account-type">{account.cardType}</span>
                                        </div>
                                        <div className="account-balance">
                                            <p>₹{parseFloat(account.balance).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="upcoming-bills">
                            <h3>Upcoming Bills</h3>
                            <div className="bills-list">
                                {dashboardData.upcomingBills
                                    .filter(bill => !bill.isPaid)
                                    .map(bill => {
                                        const daysUntil = Math.ceil(
                                            (new Date(bill.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
                                        );
                                        const isUrgent = daysUntil <= 3;

                                        return (
                                            <div 
                                                key={bill.billId} 
                                                className={`bill-item ${isUrgent ? 'urgent' : ''}`}
                                            >
                                                <div className="bill-info">
                                                    <h4>{bill.billName}</h4>
                                                    <p>₹{parseFloat(bill.amount).toLocaleString()}</p>
                                                </div>
                                                <div className="bill-due">
                                                    <span>Due in {daysUntil} days</span>
                                                    <span>{new Date(bill.dueDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        <div className="recent-transactions">
                            <h3>Recent Transactions</h3>
                            <table className="transactions-table">
                                <thead>
                                    <tr>
                                        <th>Transaction ID</th>
                                        <th>Account</th>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.recentTransactions.map(transaction => (
                                        <tr key={transaction.transactionId}>
                                            <td>{transaction.transactionId}</td>
                                            <td>{transaction.accountName}</td>
                                            <td>{new Date(transaction.date).toLocaleDateString()}</td>
                                            <td>{transaction.transactionType}</td>
                                            <td className={`transaction-amount ${transaction.transactionType === 'CREDIT' ? 'credit' : 'debit'}`}>
                                                {transaction.transactionType === 'CREDIT' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                                            </td>
                                            <td>{transaction.categoryId ? dashboardData.categories?.find(cat => cat.categoryId === transaction.categoryId)?.categoryName : 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;