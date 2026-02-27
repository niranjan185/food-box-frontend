// Admin Dashboard Notifications

// Helper function for fetch with timeout
function fetchWithTimeout(url, options = {}, timeout = 10000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ]);
}

class AdminNotifications {
    constructor() {
        // Store DOM elements
        this.notificationBadge = document.getElementById('notificationBadge');
        this.notificationList = document.getElementById('notificationList');
        this.notificationDropdown = document.getElementById('notificationDropdown');
        this.isLoading = false;
        this.pollingInterval = null;
        this.sessionCheckPending = false;
        
        // Initialize if elements exist
        if (this.notificationBadge && this.notificationList) {
            this.init();
        }
    }
    
    // Handle session expiration (Option A): pause, re-check, then decide
    handleSessionExpired() {
        if (this.sessionCheckPending) return;
        this.sessionCheckPending = true;
        console.log('Session possibly expired. Verifying session before redirect...');

        // Show message in dropdown
        if (this.notificationList) {
            this.notificationList.innerHTML = `
                <li class="dropdown-item text-center text-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Verifying your session... Please wait
                </li>`;
        }

        // Stop polling while we verify
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        // Re-check with a dedicated endpoint
        setTimeout(async () => {
            try {
                const resp = await fetch('/webtechnologies/FoodBox/backend/api/admin/check_session.php', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });

                if (resp.ok) {
                    // Session is valid again. Resume.
                    this.sessionCheckPending = false;
                    await this.loadNotifications();
                    if (!this.pollingInterval) {
                        this.pollingInterval = setInterval(() => {
                            if (!document.hidden) {
                                this.loadNotifications().catch(console.error);
                            }
                        }, 30000);
                    }
                    return;
                }
            } catch (e) {
                console.error('Session verification error:', e);
            }

            // Still unauthorized or error — redirect to login
            window.location.href = '/webtechnologies/FoodBox/frontend/admin_dashboard/admin_login.html';
        }, 1000);
    }
    
    async init() {
        try {
            // Load notifications on page load
            await this.loadNotifications();
            
            // Set up polling for new notifications
            this.pollingInterval = setInterval(() => {
                if (!document.hidden) { // Only poll when tab is active
                    this.loadNotifications().catch(console.error);
                }
            }, 30000); // Every 30 seconds
            
            // Mark as read when dropdown is shown
            if (this.notificationDropdown) {
                this.notificationDropdown.addEventListener('shown.bs.dropdown', () => {
                    this.markAllAsRead().catch(console.error);
                });
            }
            
            // Handle page visibility changes
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    // Tab became active, refresh notifications
                    this.loadNotifications().catch(console.error);
                }
            });
            
        } catch (error) {
            console.error('Error initializing notifications:', error);
        }
        
        // Add refresh button to dropdown header
        const header = document.querySelector('.dropdown-header');
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn btn-sm btn-link text-decoration-none p-0 ms-2';
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        refreshBtn.title = 'Refresh';
        refreshBtn.onclick = (e) => {
            e.stopPropagation();
            if (!this.isLoading) this.loadNotifications();
        };
        header.appendChild(refreshBtn);
        
        // Handle mark all as read
        const markAllReadBtn = document.createElement('div');
        markAllReadBtn.className = 'dropdown-item small text-muted text-center cursor-pointer';
        markAllReadBtn.innerHTML = '<i class="fas fa-check-double me-1"></i> Mark all as read';
        markAllReadBtn.onclick = (e) => {
            e.stopPropagation();
            this.markAllAsRead();
        };
        this.notificationList.parentNode.insertBefore(markAllReadBtn, this.notificationList.nextSibling);
    }
    
    async loadNotifications() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const spinner = '<div class="text-center py-2"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        const currentContent = this.notificationList.innerHTML;
        
        try {
            // Show loading state
            this.notificationList.innerHTML = spinner;
            
            // Load unread count
            const countResponse = await fetchWithTimeout('/webtechnologies/FoodBox/backend/api/support/unread_count.php?_=' + Date.now(), {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!countResponse.ok) {
                if (countResponse.status === 401) {
                    this.handleSessionExpired();
                    return;
                }
                throw new Error(`HTTP error! status: ${countResponse.status}`);
            }
            
            const countData = await countResponse.json();
            
            if (countData && countData.success) {
                const count = parseInt(countData.count || 0, 10);
                this.updateBadge(count);
            } else {
                console.error('Invalid response format from unread_count.php:', countData);
                throw new Error('Invalid response format');
            }
            
            // Load recent notifications
            const notifResponse = await fetchWithTimeout('/webtechnologies/FoodBox/backend/api/support/recent_notifications.php?limit=5&_=' + Date.now(), {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!notifResponse.ok) {
                if (notifResponse.status === 401) {
                    this.handleSessionExpired();
                    return;
                }
                throw new Error(`HTTP error! status: ${notifResponse.status}`);
            }
            
            const notifData = await notifResponse.json();
            
            if (notifData && notifData.success) {
                this.renderNotifications(Array.isArray(notifData.notifications) ? notifData.notifications : []);
            } else {
                console.error('Invalid response format from recent_notifications.php:', notifData);
                throw new Error('Invalid notifications data');
            }
            
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.notificationList.innerHTML = `
                <li class="dropdown-item text-center text-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Failed to load notifications
                    <div class="mt-1">
                        <button class="btn btn-sm btn-outline-danger" onclick="window.location.reload()">
                            <i class="fas fa-sync-alt me-1"></i> Retry
                        </button>
                    </div>
                </li>`;
        } finally {
            this.isLoading = false;
        }
    }
    
    updateBadge(count) {
        if (!this.notificationBadge) return;
        
        if (count > 0) {
            this.notificationBadge.textContent = count > 99 ? '99+' : count;
            this.notificationBadge.style.display = 'block';
        } else {
            this.notificationBadge.style.display = 'none';
        }
    }
    
    renderNotifications(notifications) {
        if (!Array.isArray(notifications) || notifications.length === 0) {
            this.notificationList.innerHTML = `
                <li class="dropdown-item text-center text-muted py-3">
                    <i class="far fa-bell-slash fa-2x mb-2 d-block"></i>
                    No new notifications
                </li>`;
            return;
        }

        let html = '';
        notifications.forEach(notification => {
            const isNew = notification.is_new !== false; // Default to true if not specified
            const timeAgo = this.formatTimeAgo(notification.created_at);
            const statusClass = this.getStatusClass(notification.status);
            
            // Create notification item
            html += `
                <li>
                    <a class="dropdown-item ${isNew ? 'fw-bold' : ''}" 
                       href="support_tickets.html?ticket_id=${notification.id}"
                       onclick="event.stopPropagation();"
                       style="${isNew ? 'background-color: rgba(13, 110, 253, 0.05);' : ''}">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="me-2">
                                <div class="d-flex align-items-center">
                                    <span class="badge ${statusClass} me-2">${this.formatStatus(notification.status)}</span>
                                    <small class="text-muted">#${notification.ticket_id || notification.id}</small>
                                </div>
                                <div class="mt-1">
                                    ${this.escapeHtml(notification.subject || 'New support ticket')}
                                </div>
                                ${notification.message ? `
                                    <div class="small text-muted mt-1 text-truncate">
                                        ${this.escapeHtml(notification.message.substring(0, 60))}${notification.message.length > 60 ? '...' : ''}
                                    </div>
                                ` : ''}
                            </div>
                            <small class="text-nowrap text-muted">${timeAgo}</small>
                        </div>
                    </a>
                </li>
                <li><hr class="dropdown-divider my-1"></li>
            `;
        });
        
        // Remove the last divider
        if (html.endsWith('<li><hr class="dropdown-divider my-1"></li>\n')) {
            html = html.substring(0, html.lastIndexOf('<li><hr class="dropdown-divider my-1"></li>\n'));
        }
        
        this.notificationList.innerHTML = html;
    }
    
    async markAllAsRead() {
        if (this.isLoading) return;
        
        const originalContent = this.notificationList.innerHTML;
        this.notificationList.innerHTML = '<div class="text-center py-2"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Updating...</span></div></div>';
        
        try {
            const response = await fetchWithTimeout('/webtechnologies/FoodBox/backend/api/support/mark_all_read.php?_=' + Date.now(), {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                },
                body: 'timestamp=' + encodeURIComponent(new Date().toISOString())
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.handleSessionExpired();
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.success) {
                // Update the UI to show all notifications as read
                this.updateBadge(0);
                
                // Show success message
                this.notificationList.innerHTML = `
                    <li class="dropdown-item text-center text-success">
                        <i class="fas fa-check-circle me-2"></i>
                        All notifications marked as read
                    </li>`;
                
                // Reload notifications after a short delay
                setTimeout(() => this.loadNotifications(), 1500);
            } else {
                throw new Error(data?.error || 'Failed to mark notifications as read');
            }
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            this.notificationList.innerHTML = `
                <li class="dropdown-item text-center text-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    ${error.message || 'Failed to mark as read'}
                    <div class="mt-1">
                        <button class="btn btn-sm btn-outline-danger" onclick="this.closest('.dropdown-menu').querySelector('.dropdown-item').click(); window.location.reload();">
                            <i class="fas fa-redo me-1"></i> Try Again
                        </button>
                    </div>
                </li>`;
        } finally {
            this.isLoading = false;
        }
    }
    
    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return interval + 'y ago';
        
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return interval + 'mo ago';
        
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return interval + 'd ago';
        
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return interval + 'h ago';
        
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return interval + 'm ago';
        
        return 'just now';
    }
    
    formatStatus(status) {
        return status
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    getStatusClass(status) {
        const classes = {
            'open': 'bg-primary',
            'in_progress': 'bg-warning text-dark',
            'resolved': 'bg-success',
            'closed': 'bg-secondary'
        };
        return classes[status] || 'bg-light text-dark';
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Small delay to ensure session cookie is available after login navigation
        setTimeout(() => {
            try {
                new AdminNotifications();
            } catch (err) {
                console.error('Failed to initialize notifications:', err);
            }
        }, 800);
    } catch (error) {
        console.error('Failed to schedule notifications init:', error);
    }
});
