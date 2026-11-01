//fronted-web/src/components/NotificationBell.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            fetchNotifications();
            fetchUnreadCount();
            toast.success('Toutes les notifications marquées comme lues');
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'stock_received': return '📦';
            case 'request_approved': return '✅';
            case 'request_shipped': return '🚚';
            default: return '🔔';
        }
    };

    return (
        <div className="notification-bell">
            <button className="bell-button" onClick={() => setShowDropdown(!showDropdown)}>
                🔔
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>

            {showDropdown && (
                <div className="notification-dropdown">
                    <div className="dropdown-header">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                            <button className="mark-all-btn" onClick={markAllAsRead}>
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>
                    <div className="dropdown-list">
                        {notifications.length === 0 ? (
                            <div className="empty-state">Aucune notification</div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                                    onClick={() => markAsRead(notif.id)}
                                >
                                    <div className="notification-icon">
                                        {getNotificationIcon(notif.type)}
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-title">{notif.title}</div>
                                        <div className="notification-message">{notif.message}</div>
                                        <div className="notification-time">
                                            {new Date(notif.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .notification-bell {
                    position: relative;
                }
                .bell-button {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    position: relative;
                    padding: 8px;
                }
                .bell-button .badge {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: #ef4444;
                    color: white;
                    font-size: 10px;
                    border-radius: 50%;
                    min-width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                }
                .notification-dropdown {
                    position: absolute;
                    right: 0;
                    top: 45px;
                    width: 380px;
                    max-height: 500px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    z-index: 1000;
                    overflow: hidden;
                }
                .dropdown-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e2e8f0;
                    font-weight: 600;
                }
                .mark-all-btn {
                    background: none;
                    border: none;
                    color: #3b82f6;
                    font-size: 12px;
                    cursor: pointer;
                }
                .dropdown-list {
                    max-height: 450px;
                    overflow-y: auto;
                }
                .notification-item {
                    display: flex;
                    gap: 12px;
                    padding: 12px 16px;
                    border-bottom: 1px solid #f0f0f0;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .notification-item:hover {
                    background: #f8f9fa;
                }
                .notification-item.unread {
                    background: #e0e7ff;
                }
                .notification-icon {
                    font-size: 24px;
                }
                .notification-content {
                    flex: 1;
                }
                .notification-title {
                    font-weight: 600;
                    font-size: 14px;
                    margin-bottom: 4px;
                }
                .notification-message {
                    font-size: 12px;
                    color: #64748b;
                    margin-bottom: 4px;
                }
                .notification-time {
                    font-size: 10px;
                    color: #94a3b8;
                }
                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #94a3b8;
                }
            `}</style>
        </div>
    );
}

export default NotificationBell;
