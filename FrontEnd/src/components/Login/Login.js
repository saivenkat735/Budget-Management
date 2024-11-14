import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import './Login.css';
import { jwtDecode } from 'jwt-decode';

const Login = ({ isRegister = false }) => {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isRegister) {
                if (formData.password !== formData.confirmPassword) {
                    toast.error('Passwords do not match');
                    return;
                }

                const response = await api.auth.post('/person/register', {
                    username: formData.username,
                    password: formData.password
                });

                if (response.status === 201) {
                    toast.success('Registration successful! Please login.');
                    navigate('/login');
                }
            } else {
                const response = await api.auth.post('/person/login', {
                    username: formData.username,
                    password: formData.password
                });
                const decoded = jwtDecode(response.data.token);
                localStorage.setItem("personId", decoded.username);

                if (response.data.token) {
                    login(response.data.token);
                    toast.success('Login successful!');
                }
            }
        } catch (error) {
            console.error('Authentication error:', error);
            toast.error(error.response?.data || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({
                                ...formData,
                                username: e.target.value
                            })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({
                                ...formData,
                                password: e.target.value
                            })}
                            required
                        />
                    </div>

                    {isRegister && (
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    confirmPassword: e.target.value
                                })}
                                required
                            />
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {isRegister ? (
                            <>
                                Already have an account? 
                                <button onClick={() => navigate('/login')}>Sign In</button>
                            </>
                        ) : (
                            <>
                                Don't have an account? 
                                <button onClick={() => navigate('/register')}>Create Account</button>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
