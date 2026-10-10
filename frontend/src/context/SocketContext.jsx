import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [lastLocationEvent, setLastLocationEvent] = useState(null);
  const [lastAIEvent, setLastAIEvent] = useState(null);
  const [lastItineraryEvent, setLastItineraryEvent] = useState(null);
  const [lastGroupEvent, setLastGroupEvent] = useState(null);
  const [lastBroadcastEvent, setLastBroadcastEvent] = useState(null);

  useEffect(() => {
    let s = null;
    try {
      // Connect to local dev server or origin
      const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
      s = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 2,
        timeout: 4000,
        autoConnect: true
      });

      s.on('connect', () => {
        setConnected(true);
      });

      s.on('disconnect', () => {
        setConnected(false);
      });

      s.on('connect_error', () => {
        setConnected(false);
      });

      // Real-time event listeners
      s.on('emergency:new', (data) => {
        setActiveEmergency(data);
        addNotification({
          id: `notif_${Date.now()}`,
          title: '🚨 HIGH PRIORITY SOS ALERT',
          message: `${data.tourist_name || 'Tourist'} triggered emergency in ${data.group_name || 'Group'}.`,
          type: 'EMERGENCY',
          time: new Date().toLocaleTimeString()
        });
      });

      s.on('emergency:resolved', (data) => {
        setActiveEmergency(null);
        addNotification({
          id: `notif_${Date.now()}`,
          title: '✅ Emergency Resolved',
          message: `Emergency #${data.id} marked as resolved.`,
          type: 'INFO',
          time: new Date().toLocaleTimeString()
        });
      });

      s.on('location:update', (data) => {
        setLastLocationEvent(data);
      });

      s.on('ai:recommendation', (data) => {
        setLastAIEvent(data);
        addNotification({
          id: `notif_${Date.now()}`,
          title: '🤖 Multi-Agent AI Recommendation',
          message: data.recommendation?.recommendation || 'AI coordinator generated updated tour insight.',
          type: 'AI',
          time: new Date().toLocaleTimeString()
        });
      });

      s.on('itinerary:update', (data) => {
        setLastItineraryEvent(data);
        addNotification({
          id: `notif_${Date.now()}`,
          title: '📅 Itinerary Dynamic Update',
          message: data.message || 'Tour itinerary schedule adapted in real time.',
          type: 'INFO',
          time: new Date().toLocaleTimeString()
        });
      });

      s.on('group:update', (data) => {
        setLastGroupEvent(data);
        addNotification({
          id: `notif_${Date.now()}`,
          title: '👥 Group Reconfiguration',
          message: 'AI adaptive groups updated.',
          type: 'INFO',
          time: new Date().toLocaleTimeString()
        });
      });

      s.on('broadcast:new', (data) => {
        setLastBroadcastEvent(data);
        addNotification({
          id: `notif_${Date.now()}`,
          title: `📢 Announcement: ${data.title}`,
          message: data.message,
          type: data.priority === 'HIGH' ? 'EMERGENCY' : 'INFO',
          time: new Date().toLocaleTimeString()
        });
      });

      s.on('broadcast:ack', (data) => {
        setLastBroadcastEvent(data);
      });

      setSocket(s);
    } catch (e) {
      console.warn('[SocketContext] Offline mode:', e.message);
    }

    return () => {
      if (s) s.disconnect();
    };
  }, []);

  const addNotification = (notif) => {
    setNotifications((prev) => [notif, ...prev.slice(0, 19)]);
  };

  const clearEmergency = () => {
    setActiveEmergency(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        activeEmergency,
        clearEmergency,
        notifications,
        lastLocationEvent,
        lastAIEvent,
        lastItineraryEvent,
        lastGroupEvent,
        lastBroadcastEvent
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
