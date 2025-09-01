// lib/socketService.ts
import { Server as IOServer } from "socket.io";

let io: IOServer | any = null; // allow fallback

export const getSocketIO = () => io;

export const setSocketIO = (socketInstance: IOServer | any) => {
  io = socketInstance;
};

export const initSocketIO = () => {
  if (!io && typeof window === "undefined") {
    io = new IOServer({
      path: "/api/socket",
      cors: { origin: "*" },
    });

    io.on("connection", (socket:any) => {
      console.log("🔌 Client connected:", socket.id);
      socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
      });
    });

    console.log("✅ Socket.IO server created in memory");
  }
  return io;
};
