import express from "express";
import cors from "cors";
import morgan from "morgan";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import contactRoutes from "./routes/contactRoutes.js"
import { errorHandler } from "./middleware/errorHandler.js";
import notificationRoutes  from "./models/Notification.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/contacts",contactRoutes)
app.use("/api/notifications",notificationRoutes )


app.use(errorHandler);

export default app;
