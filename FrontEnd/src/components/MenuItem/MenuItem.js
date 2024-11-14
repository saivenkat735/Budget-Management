import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import './MenuItem.css';

const MenuItem = ({ path, icon, label, isActive }) => {
    return (
        <Link 
            to={path} 
            className={`menu-item ${isActive ? 'active' : ''}`}
        >
            <div className="menu-item-icon">
                {icon}
            </div>
            <span className="menu-item-label">
                {label}
            </span>
            {isActive && <div className="menu-item-indicator" />}
        </Link>
    );
};

MenuItem.propTypes = {
    path: PropTypes.string.isRequired,
    icon: PropTypes.element.isRequired,
    label: PropTypes.string.isRequired,
    isActive: PropTypes.bool
};

MenuItem.defaultProps = {
    isActive: false
};

export default MenuItem;
