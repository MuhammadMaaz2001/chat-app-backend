import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./db/connect.js";
import app from "./app.js";
import { socketHandler } from "./socket/index.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
await connectDB();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Setup socket listeners
socketHandler(io);

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
