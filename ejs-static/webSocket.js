import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

// this is just a dev server to view changes so not broadcasting
wss.on("connection", (ws) => {
  ws.on("error", console.error);

  ws.on("message", (data) => {
    console.log("received: %s", data);

    const dataObj = JSON.parse(data);
    const action = dataObj.action;

    if (action === "joinroom") {
      console.log("joinroom");
      const RoomID = dataObj.roomID;
      ws.send(JSON.stringify({ action, RoomID, message: "Joined room" }));
    } else if (action === "sendmessage") {
      console.log("sendmessage");
      const RoomID = dataObj.RoomID;
      const message = dataObj.message;
      ws.send(JSON.stringify({ action, RoomID, message }));
    } else {
      ws.send(JSON.stringify({ action, message: "Invalid action" }));
    }
  });
});
