import React, { useState, useEffect } from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import '../styles/NotificationCenter.css';

const NotificationCenter = () => {
  const { account } = useWalletConnect();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [settings, setSettings] = useState({
    enabled: true,
    sound: true,
    desktop: false,
    types: {
      transaction: true,
      proposal: true,
      nft: true,
      system: true,
      security: true
    }
  });

  const notificationTypes = {
    transaction: { icon: '💰', color: '#3498db', label: 'Transaction' },
    proposal: { icon: '📋', color: '#9b59b6', label: 'Proposal' },
    nft: { icon: '🎨', color: '#e67e22', label: 'NFT' },
    system: { icon: '⚙️', color: '#95a5a6', label: 'System' },
    security: { icon: '🔒', color: '#e74c3c', label: 'Security' }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadNotifications = () => {
    const saved = localStorage.getItem(`notifications-${account || 'default'}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return generateSampleNotifications();
  };

  const generateSampleNotifications = () => {
    const now = Date.now();
    return [
      {
        id: 'notif-1',
        type: 'transaction',
        title: 'Transaction Confirmed',
        message: 'Your STX transfer of 500 STX has been confirmed on block 12345',
        timestamp: now - 300000,
        read: false,
        priority: 'high',
        actionLabel: 'View Transaction',
        actionUrl: 'https://explorer.hiro.so/txid/0x123?chain=testnet'
      },
      {
        id: 'notif-2',
        type: 'proposal',
        title: 'New Proposal Available',
        message: 'A new governance proposal "Treasury Allocation Q1" is now open for voting',
        timestamp: now - 1800000,
        read: false,
        priority: 'medium',
        actionLabel: 'Vote Now'
      },
      {
        id: 'notif-3',
        type: 'nft',
        title: 'NFT Received',
        message: 'You received a new NFT "Cosmic Warrior #247" from ST2CY5V39N...',
        timestamp: now - 3600000,
        read: true,
        priority: 'medium',
        actionLabel: 'View NFT'
      },
      {
        id: 'notif-4',
        type: 'security',
        title: 'Security Alert',
        message: 'A new wallet connection was detected from a different device',
        timestamp: now - 7200000,
        read: true,
        priority: 'high',
        actionLabel: 'Review Activity'
      },
      {
        id: 'notif-5',
        type: 'system',
        title: 'System Update',
        message: 'New features added: Activity Feed and Notification Center are now available',
        timestamp: now - 14400000,
        read: true,
        priority: 'low',
        actionLabel: 'Learn More'
      }
    ];
  };

  useEffect(() => {
    const loaded = loadNotifications();
    setNotifications(loaded);

    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [account]);

  useEffect(() => {
    localStorage.setItem(`notifications-${account || 'default'}`, JSON.stringify(notifications));
  }, [notifications, account]);

  useEffect(() => {
    localStorage.setItem('notification-settings', JSON.stringify(settings));
  }, [settings]);

  const addNotification = (notification) => {
    const newNotification = {
      id: `notif-${Date.now()}`,
      timestamp: Date.now(),
      read: false,
      priority: 'medium',
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);

    if (settings.enabled && settings.types[notification.type]) {
      if (settings.sound) {
        playNotificationSound();
      }
      if (settings.desktop && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo192.png'
        });
      }
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzKF0fPTgjMGHm7A7+OZSA0PVanm8LJfGAg+ltzyxnMpBSh+zPDZkTsJFmS56+mgUBAKTKXh8rhlHAU3kdXzzn0tBSt9y/HajDkHG27C8N6VRA0PU6zn77RgGQdBmdzzy3QrBSh9y/HajDkHG27C8N6VRA0PU6zn77RgGQdBmdzzy3QrBSh9y/HajDkHG27C8N6VRA0PU6zn77RgGQdBmdzzy3QrBSh9y/HajDkHG27C8N6VRA0PU6zn77RgGQdBmdzzy3QrBSh9y/HajDkHG27C8N6VRA0PU6zn77RgGQdBmdzzy3QrBSh9y/HajDkHG27C8N6VRA0PU6zn77RgGQdBmdzzy3QrBQ==');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([]);
    }
  };

  const requestDesktopPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setSettings(prev => ({ ...prev, desktop: true }));
      }
    }
  };

  const updateSettings = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateTypeSetting = (type, value) => {
    setSettings(prev => ({
      ...prev,
      types: { ...prev.types, [type]: value }
    }));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const stats = {
    total: notifications.length,
    unread: unreadCount,
    transaction: notifications.filter(n => n.type === 'transaction').length,
    proposal: notifications.filter(n => n.type === 'proposal').length,
    nft: notifications.filter(n => n.type === 'nft').length,
    system: notifications.filter(n => n.type === 'system').length,
    security: notifications.filter(n => n.type === 'security').length
  };

  return (
    <>
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-center">
          <div className="notification-backdrop" onClick={() => setIsOpen(false)} />
          <div className="notification-panel">
            <div className="notification-header">
              <h2>🔔 Notifications</h2>
              <div className="header-actions">
                {unreadCount > 0 && (
                  <button className="mark-all-read" onClick={markAllAsRead}>
                    Mark all read
                  </button>
                )}
                <button className="clear-all" onClick={clearAll} title="Clear all">
                  🗑️
                </button>
                <button className="close-panel" onClick={() => setIsOpen(false)}>
                  ✕
                </button>
              </div>
            </div>

            <div className="notification-stats">
              <div className="stat-item">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-item highlight">
                <span className="stat-value">{stats.unread}</span>
                <span className="stat-label">Unread</span>
              </div>
            </div>

            <div className="notification-filters">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({stats.total})
              </button>
              <button
                className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Unread ({stats.unread})
              </button>
              <button
                className={`filter-btn ${filter === 'transaction' ? 'active' : ''}`}
                onClick={() => setFilter('transaction')}
              >
                💰 ({stats.transaction})
              </button>
              <button
                className={`filter-btn ${filter === 'proposal' ? 'active' : ''}`}
                onClick={() => setFilter('proposal')}
              >
                📋 ({stats.proposal})
              </button>
              <button
                className={`filter-btn ${filter === 'nft' ? 'active' : ''}`}
                onClick={() => setFilter('nft')}
              >
                🎨 ({stats.nft})
              </button>
            </div>

            <div className="notification-list">
              {filteredNotifications.length === 0 ? (
                <div className="notification-empty">
                  <div className="empty-icon">📭</div>
                  <h3>No notifications</h3>
                  <p>You're all caught up!</p>
                </div>
              ) : (
                filteredNotifications.map(notification => {
                  const typeInfo = notificationTypes[notification.type];
                  return (
                    <div
                      key={notification.id}
                      className={`notification-item ${notification.read ? 'read' : 'unread'} priority-${notification.priority}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div
                        className="notification-icon"
                        style={{ background: `linear-gradient(135deg, ${typeInfo.color}, ${typeInfo.color}dd)` }}
                      >
                        {typeInfo.icon}
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">
                          {notification.title}
                          {!notification.read && <span className="unread-dot">●</span>}
                        </div>
                        <div className="notification-message">{notification.message}</div>
                        <div className="notification-footer">
                          <span className="notification-time">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          {notification.actionLabel && (
                            <button className="notification-action">
                              {notification.actionLabel}
                            </button>
                          )}
                        </div>
                      </div>
                      <button
                        className="notification-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="notification-settings">
              <h3>⚙️ Settings</h3>

              <label className="setting-toggle">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => updateSettings('enabled', e.target.checked)}
                />
                <span>Enable notifications</span>
              </label>

              <label className="setting-toggle">
                <input
                  type="checkbox"
                  checked={settings.sound}
                  onChange={(e) => updateSettings('sound', e.target.checked)}
                  disabled={!settings.enabled}
                />
                <span>Sound alerts</span>
              </label>

              {('Notification' in window) && (
                <label className="setting-toggle">
                  <input
                    type="checkbox"
                    checked={settings.desktop}
                    onChange={(e) => {
                      if (e.target.checked) {
                        requestDesktopPermission();
                      } else {
                        updateSettings('desktop', false);
                      }
                    }}
                    disabled={!settings.enabled}
                  />
                  <span>Desktop notifications</span>
                </label>
              )}

              <div className="setting-group">
                <h4>Notification Types</h4>
                {Object.keys(notificationTypes).map(type => (
                  <label key={type} className="setting-toggle small">
                    <input
                      type="checkbox"
                      checked={settings.types[type]}
                      onChange={(e) => updateTypeSetting(type, e.target.checked)}
                      disabled={!settings.enabled}
                    />
                    <span>
                      {notificationTypes[type].icon} {notificationTypes[type].label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationCenter;
