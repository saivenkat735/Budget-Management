import React from 'react';
import { useLocation } from 'react-router-dom';
import MenuItem from '../MenuItem/MenuItem';
import { 
    FaHome, 
    FaExchangeAlt, 
    FaTags, 
    FaFileInvoiceDollar,
    FaChartPie,
    FaWallet,
    FaCalendarAlt,
    FaChartLine,
    FaBullseye
} from 'react-icons/fa';
import './Menu.css';

const Menu = ({ isOpen }) => {
    const location = useLocation();

    const menuItems = [
        {
            path: '/dashboard',
            icon: <FaHome />,
            label: 'Dashboard'
        },
        {
            path: '/transactions',
            icon: <FaExchangeAlt />,
            label: 'Transactions'
        },
        {
            path: '/categories',
            icon: <FaTags />,
            label: 'Categories'
        },
        {
            path: '/bills',
            icon: <FaFileInvoiceDollar />,
            label: 'Bills'
        },
        {
            path: '/budget',
            icon: <FaChartPie />,
            label: 'Budget Planner'
        },
        {
            path: '/investments',
            icon: <FaWallet />,
            label: 'Investments'
        },
        {
            path: '/recurring-payments',
            icon: <FaCalendarAlt />,
            label: 'Recurring Payments'
        },
        {
            path: '/reports',
            icon: <FaChartLine />,
            label: 'Reports'
        },
        {
            path: '/goals',
            icon: <FaBullseye />,
            label: 'Financial Goals'
        }
    ];

    return (
        <nav className={`menu ${isOpen ? 'open' : ''}`}>
            <div className="menu-items">
                {menuItems.map((item) => (
                    <MenuItem
                        key={item.path}
                        path={item.path}
                        icon={item.icon}
                        label={item.label}
                        isActive={location.pathname === item.path}
                    />
                ))}
            </div>
        </nav>
    );
};

export default Menu;
