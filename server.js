const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const hostname = "192.168.1.100";
const port = process.env.PORT || 9100;

const app = express();
app.use(cors());
app.options("*", cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // origin: "http://192.168.1.100:9100",
    origin: "http://localhost:3000",
    allowedHeaders: "*",
    methods: ["*"],
  },
});
server.listen(port, hostname, () => {
  console.log(`server started on ${hostname + ":" + port}`);
});

let MESSAGES = [];

io.on("connection", (socket) => {
  const users = [];
  const sockets = [];
  const msgToAll = () =>
    sockets.map((s) => {
      s.socket.emit("users", users);
    });

  for (let [id, socket] of io.of("/").sockets) {
    users.push({
      userID: id,
      username: socket.username,
    });
    sockets.push({ id, socket });
  }
  socket.emit("message", MESSAGES);

  socket.on("disconnect", (reason) => {
    users.map((u) => (u.userID !== socket.id ? u : undefined));

    if (users.length == 0) {
      MESSAGES = [];
    }
  });
  msgToAll();

  socket.on("message-sent", ({ message, from, nickName }) => {
    MESSAGES = MESSAGES.map((m) => {
      if (m === undefined) {
        return;
      }
      return m.from === from ? { ...m, nickName } : m;
    });

    MESSAGES.push({ message, from, nickName });

    io.of("/").emit("message", MESSAGES);
  });
});
