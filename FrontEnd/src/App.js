import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Landing from './Landing Page/Landing';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Accounts from './components/accounts/Accounts';
import Transaction from './components/Transactions/Transaction';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Bills from './components/Bills/Bills';
import Category from './components/Category/Category.';
import FinancialReports from './components/Analytics/FinancialReports';
import KnowledgeBase from './components/KnowledgeBase/KnowledgeBase';
import ChatWidget from './components/AIChat/ChatWidget';

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="app">
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Login isRegister={true} />} />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/accounts" element={
                          <ProtectedRoute>
                            <Accounts />
                          </ProtectedRoute>} />
                        <Route path="/transactions" element={
                          <ProtectedRoute>
                            <Transaction />
                          </ProtectedRoute>} />
                        {/* Other protected routes */}
                        <Route path="/bills" element={
                          <ProtectedRoute>
                            <Bills />
                          </ProtectedRoute>} />
                          <Route path="/categories" element={
                          <ProtectedRoute>
                            <Category />
                          </ProtectedRoute>} />
                          <Route path="/reports" element={
                          <ProtectedRoute>
                            <FinancialReports />
                          </ProtectedRoute>} />
                          <Route path="/knowledge" element={
                          <ProtectedRoute>
                            <KnowledgeBase />
                          </ProtectedRoute>} />
                        {/* <Route path="*" element={<Navigate to="/" />} /> */}
                    </Routes>

                    {/* Floating AI assistant - visible on every page once logged in */}
                    <ChatWidget />

                    <ToastContainer position="top-right" />
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;
