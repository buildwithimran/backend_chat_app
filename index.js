require("dotenv").config();
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const path = require("path");
const bodyParser = require("body-parser");
const createError = require("http-errors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const { sendMessage } = require("./helper/notifications");

const port = process.env.DB_PORT || 3001;
const app = express();

// Middleware Setup
app.use(helmet());
app.use(compression({ level: 6, threshold: 0 }));
app.use(cors());
app.use(express.static(path.join(__dirname, "uploads")));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb", parameterLimit: 10000 }));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// MongoDB Connection
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Token Verification Middleware
const checkTokenFilter = (req, res, next) => {
  const publicPaths = [
    "/",
    "/user/uploader",
    "/user/sendTwillioPhoneOTP",
    "/user/sendEmailOTP",
    "/user/login",
    "/user/register",
    "/user/sendPhoneOTP",
    "/user/checkUserExist",
    "/user/check_phoneNumber_existance",
    "/user/password_reset",
    "/user/verifyUser",
  ];

  if (publicPaths.includes(req._parsedUrl.pathname)) {
    return next();
  }
  checkToken(req, res, next);
};

const checkToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token missing or malformed" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET);
    req.userId = decoded.userId; // Ensure this matches your JWT payload structure
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

app.use(checkTokenFilter);

// Route Imports
app.use("/", require("./routes/index.route"));
app.use("/user", require("./routes/user.route"));
app.use("/message", require("./routes/messages.route"));
app.use("/invitation", require("./routes/invitation.route"));
app.use("/setting", require("./routes/settings.route"));

// Error Handling
app.use((req, res, next) => next(createError(404)));
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500).render("error");
});

// WebSocket and Server Setup
const server = require("http").createServer(app);

if (!module.parent) {
  const io = new Server(server);
  const messages = [];

  io.on("connection", (socket) => {
    console.log("Socket.IO: Client connected");

    socket.on("message", async (data) => {
      const message = {
        message: data.message,
        time: data.time,
        type: data.type,
        senderUserId: data.senderUserId,
        receiverUserId: data.receiverUserId,
      };

      try {
        const result = await sendMessage(message);
        if (result.status === "success") {
          messages.push(message);
          io.emit("message", message);
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });

    socket.on("disconnect", () => console.log("Socket.IO: Client disconnected"));
  });

  // Start the server only if not already running
  server.listen(port, () => console.log(`Server running on port ${port}`));
  server.on("error", (error) => handleServerError(error, port));
}

// Helper Functions
const handleServerError = (error, port) => {
  if (error.syscall !== "listen") throw error;

  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

module.exports = app;