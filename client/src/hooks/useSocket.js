import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getToken } from './useAuth.js';

export function useSocket(onPriceUpdate) {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = io('/', { auth: { token } });
    socketRef.current = socket;

    socket.on('price-update', (data) => {
      if (onPriceUpdate) onPriceUpdate(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [onPriceUpdate]);

  return socketRef;
}
