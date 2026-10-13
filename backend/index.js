import "dotenv/config";
import express from "express";
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import cors from "cors";
import userRouter from "./routes/user.routes.js";

import itemRouter from "./routes/item.routes.js";
import shopRouter from "./routes/shop.routes.js";
import orderRouter from "./routes/order.routes.js";
import http from "http";
import { Server } from "socket.io";
import { socketHandler } from "./socket.js";

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["POST", "GET"],
  },
});

app.set("io", io);

const port = process.env.PORT || 5000;
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);

app.use((req, res) => {
  return res.status(404).json({ message: "route not found" });
});


app.use((err, req, res, next) => {
  console.error(err);
  return res
    .status(err.status || 500)
    .json({ message: err.message || "internal server error" });
});

socketHandler(io);
try {
  await connectDb();
  server.listen(port, () => {
    console.log(`server started at ${port}`);
  });
} catch (error) {
  console.error("failed to start server:", error.message);
  process.exit(1);
}
