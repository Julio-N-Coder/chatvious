import "../../css/styles.css";
// production url not decided yet (temp for now)
const websocketURL = process.env.IS_DEV_SERVER
  ? "ws://localhost:8080"
  : "apigateway websocket url(not set up yet)";

const socket = new WebSocket(websocketURL);

const RoomID = location.pathname.split("/").pop() as string;

const messageBox = document.getElementById("message") as HTMLElement;
const input = document.getElementById("input") as HTMLInputElement;
const button = document.getElementById("button") as HTMLButtonElement;

function sendMessage() {
  const message = input.value;
  if (message) {
    const sendMessageData = JSON.stringify({
      action: "sendmessage",
      RoomID,
      message,
    });
    socket.send(sendMessageData);
    input.value = "";
  }
}
button.addEventListener("click", sendMessage);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

socket.addEventListener("open", () => {
  // send a joinroom chat message to join the room first
  console.log("Connected to server");
  const joinChatRoomRequest = JSON.stringify({
    action: "joinroom",
    RoomID,
  });

  socket.send(joinChatRoomRequest);
});

socket.addEventListener("message", (event) => {
  console.log(event.data);
  const dataObj = JSON.parse(event.data);
  const action = dataObj.action;

  if (action === "joinroom") {
    // have loading state and remove loading state once room is joined
    console.log("joined room");
  } else if (action === "sendmessage") {
    console.log("message received");
    const RoomID = dataObj.RoomID;
    const message = dataObj.message;
    messageBox.innerText = message;
  }
});
