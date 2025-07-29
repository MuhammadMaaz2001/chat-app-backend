// const onlineUsers = new Map();

// export const socketHandler = (io) => {
//   io.on("connection", (socket) => {
//     console.log("⚡ New socket connected:", socket.id);

//     socket.on("join", (userId) => {
//       onlineUsers.set(userId, socket.id);
//       io.emit("online-users", [...onlineUsers.keys()]);
//     });

//     socket.on("typing", ({ chatId, sender }) => {
//       socket.to(chatId).emit("typing", sender);
//     });

//     socket.on("message", (message) => {
//       io.to(message.chatId).emit("message", message);
//     });

//     socket.on("disconnect", () => {
//       for (let [userId, id] of onlineUsers.entries()) {
//         if (id === socket.id) {
//           onlineUsers.delete(userId);
//           break;
//         }
//       }
//       io.emit("online-users", [...onlineUsers.keys()]);
//       console.log("🔌 Socket disconnected:", socket.id);
//     });
//   });
// };

let ioInstance;


export const onlineUsers = new Map(); // userId → socketId

export const socketHandler = (io) => {
  ioInstance = io;
  io.on("connection", (socket) => {
    console.log("✅ New socket connected:", socket.id);

    // Store userId with socket.id
    socket.on("join-server", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log("🔵 User joined:", userId);
      io.emit("online-users", [...onlineUsers.keys()]);
    });

    // Join specific chat room
    socket.on("join-chat", (chatId) => {
      socket.join(chatId);
      console.log(`🟡 Socket ${socket.id} joined chat ${chatId}`);
    });

    // Typing indicator
    socket.on("typing", (chatId) => {
      socket.to(chatId).emit("typing");
    });

    socket.on("stop-typing", (chatId) => {
      socket.to(chatId).emit("stop-typing");
    });

    // Send message to specific chat
    socket.on("new-message", (message) => {
      const { chat } = message;

      if (!chat?.users) return;

      chat.users.forEach((user) => {
        if (user._id === message.sender._id) return;
        const socketId = onlineUsers.get(user._id);
        if (socketId) {
          io.to(socketId).emit("message-received", message);
        }
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      for (let [userId, sockId] of onlineUsers.entries()) {
        if (sockId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit("online-users", [...onlineUsers.keys()]);
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
};

export const getIO = () => ioInstance;
