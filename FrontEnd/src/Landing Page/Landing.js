import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaShieldAlt, FaWallet, FaFileInvoiceDollar, FaHistory } from 'react-icons/fa';
import './Landing.css';
import pic from './../pic.png';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            <nav className="landing-nav">
                <div className="nav-logo" style={{ display: 'flex', alignItems: 'center' }}>
                    <img 
                        src={pic} 
                        alt="BudgetWise Logo"
                        className="logo-img"
                        style={{
                            width: '50px',
                            height: '50px',
                            marginRight: '6px',
                            transition: 'transform 0.3s ease',
                            cursor: 'pointer',
                            display: 'block'
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'scale(1.1) rotate(10deg)'}
                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    />
                    <h1 style={{ marginLeft: '4px' }}>BudgetWise</h1>
                </div>
                <div className="nav-links">
                    <button 
                        className="nav-btn login-btn"
                        onClick={() => {
                            // localStorage.clear(); // Clear any existing session data
                            navigate('/login');
                        }}
                    >
                        Sign In
                    </button>
                    <button 
                        className="nav-btn register-btn"
                        onClick={() => navigate('/register')}
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            <section className="hero-section">
                <div className="hero-content">
                    <h1>Smart Financial Management Made Easy</h1>
                    <p>
                        Take control of your finances effortlessly! With our platform, you can easily manage your accounts, categorize expenses, and track bills—all in one secure, user-friendly space.
                    </p>
                    <button 
                        className="cta-btn"
                        onClick={() => navigate('/register')}
                    >
                        Start Your Journey
                    </button>
                </div>
                <div className="hero-image">
                    <img 
                        src="https://media.istockphoto.com/id/2155858543/photo/business-concept-of-planning-2025-businessman-flips-wooden-cube-and-changes-words-budget-2024.webp?a=1&b=1&s=612x612&w=0&k=20&c=0D_IjS0ZuMMWR7VrP1468KY0vrfy6zgB7ufXMykINA4="
                        alt="Financial Dashboard Preview"
                        className="hero-img"
                    />
                </div>
            </section>

            <section className="features-section">
                <h2>Our Core Services</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <FaWallet />
                        </div>
                        <h3>Account Management</h3>
                        <p>Manage multiple accounts, track balances, and monitor transactions in real-time.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <FaFileInvoiceDollar />
                        </div>
                        <h3>Bill Tracking</h3>
                        <p>Never miss a payment with automated bill reminders and payment tracking.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <FaHistory />
                        </div>
                        <h3>Transaction History</h3>
                        <p>Detailed transaction history with categorization and analysis tools.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <FaChartLine />
                        </div>
                        <h3>Financial Analytics</h3>
                        <p>Comprehensive insights into your spending patterns and financial health.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <FaShieldAlt />
                        </div>
                        <h3>Secure Platform</h3>
                        <p>Bank-grade security to protect your financial data and transactions.</p>
                    </div>
                </div>
                {/* <div className="features-preview">
                    <img 
                        src="https://www.idfcfirstbank.com/content/dam/idfcfirstbank/images/blog/finance/difference-between-money-finance-funds-717X404.jpg"
                        alt="Features Preview"
                        className="features-img"
                    />
                </div> */}
            </section>

            <section className="benefits-section">
                <div className="benefits-content">
                    <h2>Why Choose BudgetWise?</h2>
                    <ul className="benefits-list">
                        <li>Real-time account balance tracking</li>
                        <li>Automated bill payment reminders</li>
                        <li>Detailed transaction categorization</li>
                        <li>Secure data encryption</li>
                        <li>Comprehensive financial reports</li>
                        <li>Mobile-friendly interface</li>
                    </ul>
                </div>
                <div className="benefits-image">
                    <img 
                        src="https://www.idfcfirstbank.com/content/dam/idfcfirstbank/images/blog/finance/difference-between-money-finance-funds-717X404.jpg" 
                        alt="Features Preview"
                        className="benefits-img"
                    />
                </div>
            </section>

            <section className="cta-section">
                <h2>Ready to Take Control of Your Finances?</h2>
                <p>Join thousands of users who are already managing their finances smarter.</p>
                <button 
                    className="cta-btn"
                    onClick={() => navigate('/register')}
                >
                    Get Started Now
                </button>
            </section>

            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>BudgetWise</h3>
                        <p>Smart financial management for a better future.</p>
                    </div>
                    <div className="footer-section">
                        <h4>Features</h4>
                        <ul>
                            <li><a onClick={() => {localStorage.setItem('requestedRoute', '/accounts'); navigate('/login');}}>Account Management</a></li>
                            <li><a onClick={() => {localStorage.setItem('requestedRoute', '/bills'); navigate('/login');}}>Bill Tracking</a></li>
                            <li><a onClick={() => {localStorage.setItem('requestedRoute', '/transactions'); navigate('/login');}}>Transaction History</a></li>
                            <li><a onClick={() => {localStorage.setItem('requestedRoute', '/reports'); navigate('/login');}}>Financial Analytics</a></li>
                            <li><a onClick={() => {localStorage.setItem('requestedRoute', '/categories'); navigate('/categories');}}>Categories</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Security</h4>
                        <ul>
                            <li>Data Protection</li>
                            <li>Secure Authentication</li>
                            <li>Privacy Policy</li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 BudgetWise. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
