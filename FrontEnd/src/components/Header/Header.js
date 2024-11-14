import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaBell, FaSearch, FaBars } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import './Header.css';

const Header = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const token = localStorage.getItem('authToken');
    const username = token ? jwtDecode(token).username : '';

    const handleProfileClick = () => {
        navigate('/profile');
    };

    return (
        <header className="header">
            <div className="header-left">
                <button 
                    className="menu-toggle"
                    onClick={onMenuClick}
                    aria-label="Toggle menu"
                >
                    <FaBars />
                </button>
                <div className="search-bar">
                    <FaSearch className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="search-input"
                    />
                </div>
            </div>

            <div className="header-right">
                <div className="notifications">
                    <button 
                        className="notification-btn"
                        aria-label="Notifications"
                    >
                        <FaBell />
                        <span className="notification-badge">3</span>
                    </button>
                </div>

                <div 
                    className="user-profile" 
                    onClick={handleProfileClick}
                    role="button"
                    tabIndex={0}
                    aria-label="User profile"
                >
                    <div className="profile-avatar">
                        <FaUser />
                    </div>
                    <span className="username">{username}</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
