import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Sidebar from '../Dashboard/Sidebar';
import './Bills.css';

const Bills = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBillModal, setShowBillModal] = useState(false);
    const [billFormData, setBillFormData] = useState({
        billName: '',
        amount: '',
        dueDate: new Date().toISOString().split('T')[0]
    });
    const [editingBill, setEditingBill] = useState(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchBills();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get('http://localhost:2004/category');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        }
    };

    const fetchBills = async () => {
        try {
            const personId = localStorage.getItem('personId');
            const response = await axios.get(`http://localhost:9007/bills/person/${personId}`);
            
            if (!response.data) {
                toast.error('No data received from server');
                setLoading(false);
                return;
            }

            const simplifiedBills = response.data.map(bill => ({
                billId: bill.billId,
                billName: bill.billName,
                amount: bill.amount,
                dueDate: bill.dueDate,
                isPaid: bill.paid || false
            }));

            setBills(simplifiedBills);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching bills:', error);
            const errorMessage = error.response?.data || 'Failed to load bills';
            toast.error(errorMessage);
            setBills([]);
            setLoading(false);
        }
    };

    const handleAddBill = async (e) => {
        e.preventDefault();
        try {
            if (!billFormData.billName || !billFormData.amount || !billFormData.dueDate) {
                toast.error('Please fill in all required fields');
                return;
            }

            const formattedDate = new Date(billFormData.dueDate).toISOString();
            const personId = localStorage.getItem('personId');

            const billData = {
                billName: billFormData.billName,
                amount: parseFloat(billFormData.amount),
                dueDate: formattedDate,
                isPaid: false,
                accountId: personId
            };

            const response = await axios.post('http://localhost:9007/bills/addbills', billData);

            if (response.status === 200) {
                toast.success('Bill added successfully');
                setShowBillModal(false);
                resetBillForm();
                fetchBills();
            }
        } catch (error) {
            console.error('Error adding bill:', error);
            const errorMessage = error.response?.data?.message || 'Failed to add bill';
            toast.error(errorMessage);
        }
    };

    const handleUpdateBill = async (billId) => {
        try {
            const formattedDate = new Date(editingBill.dueDate).toISOString();
            const personId = localStorage.getItem('personId');
            
            const updateData = {
                ...editingBill,
                dueDate: formattedDate,
                amount: parseFloat(editingBill.amount),
                accountId: personId
            };

            const response = await axios.put(`http://localhost:9007/bills/update/${billId}`, updateData);

            if (response.status === 200) {
                toast.success('Bill updated successfully');
                setEditingBill(null);
                fetchBills();
            }
        } catch (error) {
            console.error('Error updating bill:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update bill';
            toast.error(errorMessage);
        }
    };

    const handleDeleteBill = async (billId) => {
        if (window.confirm('Are you sure you want to delete this bill?')) {
            try {
                await axios.delete(`http://localhost:9007/bills/delete/${billId}`);
                toast.success('Bill deleted successfully');
                fetchBills();
            } catch (error) {
                console.error('Error deleting bill:', error);
                toast.error('Failed to delete bill');
            }
        }
    };

    const handlePayBill = async (bill) => {
        try {
            setProcessingPayment(true);
            const personId = localStorage.getItem('personId');
            
            // Get default account for payment
            const accountResponse = await axios.get(`http://localhost:2001/api/accounts/person/${personId}`);
            const defaultAccount = accountResponse.data.find(acc => acc.active);
            
            if (!defaultAccount) {
                toast.error('No active account found for payment');
                return;
            }

            // Find or create "Bill" category
            let billCategory = categories.find(cat => cat.categoryName === "Bill");
            if (!billCategory) {
                const newCategory = {
                    categoryName: "Bill",
                    type: "DEBIT",
                    personId: personId,
                    isFloatingExpense: false
                };
                const categoryResponse = await axios.post('http://localhost:2004/category', newCategory);
                billCategory = categoryResponse.data;
                await fetchCategories();
            }

            const transactionData = {
                accountId: defaultAccount.accountId,
                amount: bill.amount,
                description: `Bill Payment - ${bill.billName}`,
                transactionType: 'DEBIT',
                date: new Date().toISOString(),
                personId: personId,
                categoryId: billCategory.categoryId
            };

            // First create the transaction
            const transactionResponse = await axios.post('http://localhost:2002/TransactionHistory/transaction', transactionData);

            if (transactionResponse.status === 200) {
                const updatedBill = { ...bill, isPaid: true };
                
                const billUpdateResponse = await axios.get(
                    `http://localhost:9007/bills/${bill.billId}/paid`);

                if (billUpdateResponse.status === 200) {
                    setBills(prevBills => 
                        prevBills.map(b => 
                            b.billId === bill.billId ? {...b, isPaid: true} : b
                        )
                    );
                    
                    toast.success(`Payment of ₹${bill.amount} processed for ${bill.billName}`);
                }
            }
        } catch (error) {
            console.error('Error processing bill payment:', error);
            toast.error('Failed to process payment');
        } finally {
            setProcessingPayment(false);
        }
    };

    const resetBillForm = () => {
        setBillFormData({
            billName: '',
            amount: '',
            dueDate: new Date().toISOString().split('T')[0]
        });
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
                <div className="bills-container">
                    <div className="bills-header">
                        <h2>Bills Management</h2>
                        <button className="add-bill-btn" onClick={() => setShowBillModal(true)}>
                            Add New Bill
                        </button>
                    </div>

                    <div className="bills-list">
                        <table>
                            <thead>
                                <tr>
                                    <th>Bill Name</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map(bill => (
                                    <tr key={bill.billId}>
                                        <td>{bill.billName}</td>
                                        <td>₹{bill.amount.toLocaleString()}</td>
                                        <td>{new Date(bill.dueDate).toLocaleDateString()}</td>
                                        <td>{bill.isPaid ? 'Paid' : 'Unpaid'}</td>
                                        <td>
                                            <button 
                                                className="pay-btn"
                                                onClick={() => handlePayBill(bill)}
                                                disabled={bill.isPaid || processingPayment}
                                            >
                                                {bill.isPaid ? 'Paid' : processingPayment ? 'Processing...' : 'Pay'}
                                            </button>
                                            <button 
                                                className="edit-btn"
                                                onClick={() => setEditingBill(bill)}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className="delete-btn"
                                                onClick={() => handleDeleteBill(bill.billId)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Bill Modal */}
                {showBillModal && (
                    <div className="modal">
                        <div className="modal-content">
                            <h3>Add New Bill</h3>
                            <form onSubmit={handleAddBill}>
                                <label>Bill Name</label>
                                <input
                                    type="text"
                                    placeholder="Bill Name"
                                    value={billFormData.billName}
                                    onChange={(e) => setBillFormData({...billFormData, billName: e.target.value})}
                                    required
                                />
                                <label>Amount</label>
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={billFormData.amount}
                                    onChange={(e) => setBillFormData({...billFormData, amount: e.target.value})}
                                    required
                                />
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    value={billFormData.dueDate}
                                    onChange={(e) => setBillFormData({...billFormData, dueDate: e.target.value})}
                                    required
                                />
                                <div className="modal-buttons">
                                    <button type="submit">Add Bill</button>
                                    <button type="button" onClick={() => setShowBillModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Bill Modal */}
                {editingBill && (
                    <div className="modal">
                        <div className="modal-content">
                            <h3>Edit Bill</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdateBill(editingBill.billId);
                            }}>
                                <input
                                    type="text"
                                    placeholder="Bill Name"
                                    value={editingBill.billName}
                                    onChange={(e) => setEditingBill({...editingBill, billName: e.target.value})}
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={editingBill.amount}
                                    onChange={(e) => setEditingBill({...editingBill, amount: e.target.value})}
                                    required
                                />
                                <input
                                    type="date"
                                    value={editingBill.dueDate?.split('T')[0]}
                                    onChange={(e) => setEditingBill({...editingBill, dueDate: e.target.value})}
                                    required
                                />
                                <div className="modal-buttons">
                                    <button type="submit">Update Bill</button>
                                    <button type="button" onClick={() => setEditingBill(null)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bills;
