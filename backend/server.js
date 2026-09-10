import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import DB_CONNECT from "./db/db.js";
import Project from "./models/project.model.js";
import { generateResult } from "./middleware/ai.middleware.js";

dotenv.config();
DB_CONNECT();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    // origin: "https://ai-developer-eosin.vercel.app",
    origin: process.env.FRONTEND || "http://localhost:3000",
    credentials: true,
  },
});

io.use(async (socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers.authorization?.split(" ")[1];
  const projectId = socket.handshake.query.projectId;
  const _socket = /** @type {any} */ (socket);
  _socket.project = await Project.findById(projectId);

  if (!token) {
    return next(new Error("unauthorized"));
  }
  const decoded = jwt.verify(token, /** @type {string} */ (process.env.JWT_SECRET));
  if (!decoded) {
    return next(new Error("unauthorized"));
  }
  _socket.user = decoded;
  next();
});

io.on("connection", (socket) => {
  const _socket = /** @type {any} */ (socket);
  _socket.roomId = _socket.project?._id.toString();
  console.log("a user connected...");
  socket.join(_socket.roomId);

  socket.on("project-message", async (data) => {
    try {
      // Save user message to DB
      await Project.findByIdAndUpdate(_socket.roomId, {
        $push: { messages: data }
      });

      const isStringMessage = typeof data.message === "string";
      const isAipresent = isStringMessage && data.message.includes("@ai");
      
      socket.broadcast.to(_socket.roomId).emit("project-message", data);
      
      if (isAipresent) {
        const prompt = data.message.replace("@ai ", "");
        const result = await generateResult(prompt);
        
        const aiMessage = {
          message: result,
          sender: {
            _id: "ai",
            email: "AI",
            name: "Orbit AI"
          },
        };

        // Save AI message to DB
        await Project.findByIdAndUpdate(_socket.roomId, {
          $push: { messages: aiMessage }
        });

        io.to(_socket.roomId).emit("project-message", aiMessage);
      }
    } catch (err) {
      console.error("Error saving/processing message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    socket.leave(_socket.roomId);
  });
});

const port = process.env.PORT || 3001;

server.listen(port, () => {
  console.log(`running on port ${port}`);
});
