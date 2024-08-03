import "../../css/styles.css";
// remove to use the built in websocket client so it can work with api gateway
import { io } from "socket.io-client";

const socket = io();
const messageBox = document.getElementById("message") as HTMLElement;
const input = document.getElementById("input") as HTMLInputElement;
const button = document.getElementById("button") as HTMLButtonElement;

function sendMessage() {
  const message = input.value;
  if (message) {
    socket.emit("message", message);
    input.value = "";
  }
}
button.addEventListener("click", sendMessage);

console.log("test");
socket.on("connect", () => {
  console.log("Connected to server");
  socket.emit("message", "Hello from the client");

  socket.on("chat message", (msg) => {
    console.log(msg);
    messageBox.innerText = msg;
  });
});
