import { Server } from "socket.io";

export default function socket_io_server(io: Server) {
  io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });

    socket.on("message", (msg) => {
      console.log(msg);
      io.emit("chat message", msg);
    });
  });
}
