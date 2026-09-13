import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocketInstance } from '../../services/socket';
import { Wifi, WifiOff } from 'lucide-react';

export const ConnectionBanner = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const socket = getSocketInstance();
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3000);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  if (isConnected && !showRestored) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`w-full py-1.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 ${
          isConnected
            ? 'bg-emerald-600 text-white'
            : 'bg-amber-600 text-white animate-pulse'
        }`}
      >
        {isConnected ? (
          <>
            <Wifi className="w-3.5 h-3.5" />
            <span>Connection restored. Back online.</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            <span>Reconnecting to real-time server...</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
