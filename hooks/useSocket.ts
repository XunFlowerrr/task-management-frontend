import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:3000";

export function useSocket(event: string, handler: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        withCredentials: true,
      });
    }
    const socket = socketRef.current;
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
      // Optionally disconnect if needed
      // socket.disconnect();
    };
  }, [event, handler]);

  return socketRef.current;
}
