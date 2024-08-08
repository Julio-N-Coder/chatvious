import { WebSocketServer } from "ws";
import {
  fakeUserInfo,
  ownedRoomInfo,
  joinedRoomInfo,
} from "./fakeEjsPageData.js";

const ownedRoomID = ownedRoomInfo.RoomID;
const joinedRoomID = joinedRoomInfo.RoomID;

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
      ws.send(JSON.stringify({ action, message: "Joined room" }));
    } else if (action === "sendmessage") {
      console.log("sendmessage");
      const message = dataObj.message;
      const RoomID = dataObj.RoomID;
      const RoomUserStatus = RoomID === ownedRoomID ? "OWNER" : "MEMBER";

      const sender = {
        userName: fakeUserInfo.userName,
        RoomUserStatus,
        profileColor: fakeUserInfo.profileColor,
      };

      ws.send(JSON.stringify({ action, sender, message }));
    } else {
      ws.send(JSON.stringify({ action, message: "Invalid action" }));
    }
  });
});
