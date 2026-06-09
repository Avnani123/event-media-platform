import { useState, useCallback } from 'react';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  // Call this function anywhere to slide a new alert onto the screen
  const addNotification = useCallback((message) => {
    const id = Date.now();
    const newNotification = { id, message };
    
    // Add the new alert to the top of our stack
    setNotifications((prev) => [newNotification, ...prev]);

    // Automatically remove this specific alert after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  // Manual dismiss when clicking the "X" button
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, addNotification, removeNotification };
}