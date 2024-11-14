import React, { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { toast } from 'react-toastify';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './FinancialGoals.css';

const FinancialGoals = () => {
    const [goals, setGoals] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newGoal, setNewGoal] = useState({
        name: '',
        target: '',
        current: 0,
        deadline: '',
        category: 'savings'
    });

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const decodedToken = jwtDecode(token);
            const response = await axios.get(
                `http://localhost:2004/goals/person/${decodedToken.personId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setGoals(response.data);
        } catch (error) {
            console.error('Error fetching goals:', error);
            toast.error('Failed to load financial goals');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('authToken');
            const decodedToken = jwtDecode(token);
            
            const goalData = {
                ...newGoal,
                personId: decodedToken.personId,
                target: parseFloat(newGoal.target),
                deadline: new Date(newGoal.deadline).toISOString()
            };

            await axios.post(
                'http://localhost:2004/goals',
                goalData,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            toast.success('Goal created successfully');
            setShowModal(false);
            fetchGoals();
            resetForm();
        } catch (error) {
            console.error('Error creating goal:', error);
            toast.error('Failed to create goal');
        }
    };

    const handleUpdate = async (goalId, amount) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.put(
                `http://localhost:2004/goals/${goalId}/progress`,
                { amount },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            toast.success('Progress updated successfully');
            fetchGoals();
        } catch (error) {
            console.error('Error updating progress:', error);
            toast.error('Failed to update progress');
        }
    };

    const handleDelete = async (goalId) => {
        if (window.confirm('Are you sure you want to delete this goal?')) {
            try {
                const token = localStorage.getItem('authToken');
                await axios.delete(
                    `http://localhost:2004/goals/${goalId}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                toast.success('Goal deleted successfully');
                fetchGoals();
            } catch (error) {
                console.error('Error deleting goal:', error);
                toast.error('Failed to delete goal');
            }
        }
    };

    const resetForm = () => {
        setNewGoal({
            name: '',
            target: '',
            current: 0,
            deadline: '',
            category: 'savings'
        });
    };

    const calculateProgress = (current, target) => {
        return (current / target) * 100;
    };

    const calculateTimeRemaining = (deadline) => {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const getProgressColor = (progress) => {
        if (progress >= 100) return '#10b981';
        if (progress >= 75) return '#3b82f6';
        if (progress >= 50) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="goals-container">
            <div className="goals-header">
                <h2>Financial Goals</h2>
                <button 
                    className="add-goal-btn"
                    onClick={() => setShowModal(true)}
                >
                    Add New Goal
                </button>
            </div>

            <div className="goals-grid">
                {goals.map(goal => (
                    <div key={goal.goalId} className="goal-card">
                        <div className="goal-progress">
                            <CircularProgressbar
                                value={calculateProgress(goal.current, goal.target)}
                                text={`${Math.round(calculateProgress(goal.current, goal.target))}%`}
                                styles={buildStyles({
                                    pathColor: getProgressColor(calculateProgress(goal.current, goal.target)),
                                    textColor: '#333',
                                    trailColor: '#e5e7eb'
                                })}
                            />
                        </div>
                        <div className="goal-info">
                            <h3>{goal.name}</h3>
                            <div className="goal-details">
                                <p>Target: ₹{goal.target.toLocaleString()}</p>
                                <p>Current: ₹{goal.current.toLocaleString()}</p>
                                <p>Days Left: {calculateTimeRemaining(goal.deadline)}</p>
                            </div>
                            <div className="goal-actions">
                                <button 
                                    className="update-progress-btn"
                                    onClick={() => {
                                        const amount = prompt('Enter amount to add to progress:');
                                        if (amount && !isNaN(amount)) {
                                            handleUpdate(goal.goalId, parseFloat(amount));
                                        }
                                    }}
                                >
                                    Update Progress
                                </button>
                                <button 
                                    className="delete-goal-btn"
                                    onClick={() => handleDelete(goal.goalId)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Create New Goal</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Goal Name</label>
                                <input
                                    type="text"
                                    value={newGoal.name}
                                    onChange={(e) => setNewGoal({
                                        ...newGoal,
                                        name: e.target.value
                                    })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Target Amount</label>
                                <input
                                    type="number"
                                    value={newGoal.target}
                                    onChange={(e) => setNewGoal({
                                        ...newGoal,
                                        target: e.target.value
                                    })}
                                    required
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Deadline</label>
                                <input
                                    type="date"
                                    value={newGoal.deadline}
                                    onChange={(e) => setNewGoal({
                                        ...newGoal,
                                        deadline: e.target.value
                                    })}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={newGoal.category}
                                    onChange={(e) => setNewGoal({
                                        ...newGoal,
                                        category: e.target.value
                                    })}
                                    required
                                >
                                    <option value="savings">Savings</option>
                                    <option value="investment">Investment</option>
                                    <option value="emergency">Emergency Fund</option>
                                    <option value="purchase">Major Purchase</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="submit-btn">
                                    Create Goal
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

export default FinancialGoals; 