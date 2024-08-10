import "../../css/styles.css";
import { sendMessageAction, MessageBoxEjsOptions } from "../types";
import messageBoxEjs from "../../../../serverless-aws-sam/src/views/components/chatRoom/messageBox.ejs";
// production url not decided yet (temp for now)
const websocketURL = process.env.IS_DEV_SERVER
  ? "ws://localhost:8080"
  : "apigateway websocket url(not set up yet)";

const socket = new WebSocket(websocketURL);
const RoomID = location.pathname.split("/").pop() as string;

const input = document.getElementById("input") as HTMLTextAreaElement;
const button = document.getElementById("button") as HTMLButtonElement;
const inputCharCount = document.getElementById(
  "inputCharCount"
) as HTMLSpanElement;
const messagesContainer = document.getElementById(
  "messagesContainer"
) as HTMLDivElement;

input.value = localStorage.getItem("chatInput") || "";
let inputLength = input.value.length;
inputCharCount.textContent = `${inputLength}/2k`;
button.disabled = inputLength <= 0;

function sendMessage() {
  const message = input.value;
  if (message && message.length > 0 && message.length <= 2000) {
    input.value = "";
    localStorage.setItem("chatInput", "");

    inputCharCount.textContent = "0/2k";
    button.disabled = true;
    input.style.height = "auto";

    const sendMessageData = JSON.stringify({
      action: "sendmessage",
      RoomID,
      message,
    });
    socket.send(sendMessageData);
  }
}
button.addEventListener("click", sendMessage);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

// dyanamically changes textarea height and sets a max height to 7 cols
input.addEventListener("input", (event) => {
  let message = input.value;
  inputLength = input.value.length;

  if (inputLength > 0) {
    button.disabled = false;
  } else {
    button.disabled = true;
  }

  if (inputLength > 2000) {
    message = message.slice(0, 2000);
    inputLength = 2000;
    input.value = message;
  }
  inputCharCount.textContent = `${inputLength}/2k`;

  localStorage.setItem("chatInput", message);

  input.style.height = "auto";
  input.style.height = input.scrollHeight + "px";
  if (input.scrollHeight > 168) {
    input.style.height = "168px";
  }
});

socket.addEventListener("open", () => {
  const joinChatRoomRequest = JSON.stringify({
    action: "joinroom",
    RoomID,
  });

  socket.send(joinChatRoomRequest);
});

socket.addEventListener("message", (event) => {
  console.log(event.data);
  const dataAction = JSON.parse(event.data);
  const action = dataAction.action;

  if (action === "joinroom") {
    // have loading state and remove loading state once room is joined
    console.log("joined room");
  } else if (action === "sendmessage") {
    console.log("message received");
    const data: sendMessageAction = dataAction;
    const userName = data.sender.userName;
    const message = data.message;

    // user sender data to show who it is
    const messageBoxOptions: MessageBoxEjsOptions = {
      userName,
      RoomUserStatus: data.sender.RoomUserStatus,
      profileColor: data.sender.profileColor,
      message: message,
      messageId: data.messageId,
      messageDate: data.messageDate,
    };

    const newMessageBox = ejs.render(messageBoxEjs, messageBoxOptions);
    const newMessageBoxElement = document.createElement("div");
    newMessageBoxElement.innerHTML = newMessageBox;

    // smoothly scroll to bottom only if they are already at the bottom
    const isScrolledToBottom =
      messagesContainer.scrollHeight - messagesContainer.clientHeight <=
      messagesContainer.scrollTop;

    messagesContainer.appendChild(newMessageBoxElement);
    if (isScrolledToBottom) {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }
});
