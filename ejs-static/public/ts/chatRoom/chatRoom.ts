import "../../css/styles.css";
import {
  sendMessageAction,
  MessageBoxEjsOptions,
  MessagePaginationKeys,
  BasicServerError,
  FetchNewMessagesSuccess,
} from "../types";
import messageBoxEjs from "../../../../serverless-aws-sam/src/views/components/chatRoom/messageBox.ejs";
import { getCookie } from "../utilities/cookies";

const RoomID = location.pathname.split("/").pop() as string;

const input = document.getElementById("input") as HTMLTextAreaElement;
const button = document.getElementById("button") as HTMLButtonElement;
const inputCharCount = document.getElementById(
  "inputCharCount"
) as HTMLSpanElement;
const messagesContainer = document.getElementById(
  "messagesContainer"
) as HTMLDivElement;
const LastEvaluatedKeyString = messagesContainer.dataset
  .lastevaluatedkey as string;
let LastEvaluatedKey = JSON.parse(LastEvaluatedKeyString) as
  | MessagePaginationKeys
  | false;

input.value = localStorage.getItem("chatInput") || "";
let inputLength = input.value.length;
inputCharCount.textContent = `${inputLength}/2k`;
button.disabled = inputLength <= 0;

window.onload = () => {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  input.focus();
};

let socket: WebSocket;
let savedMessages: string[] = [];

function isSocketOpen() {
  return socket && socket.readyState === socket.OPEN;
}

function sendMessageAction(message: string) {
  const sendMessageData = JSON.stringify({
    action: "sendmessage",
    RoomID,
    message,
  });
  socket.send(sendMessageData);
}

function sendMessage() {
  const message = input.value;
  if (message && message.length > 0 && message.length <= 2000) {
    input.value = "";
    localStorage.setItem("chatInput", "");

    inputCharCount.textContent = "0/2k";
    button.disabled = true;
    input.style.height = "auto";
    if (!isSocketOpen() && savedMessages.length < 4) {
      // save message to send later
      savedMessages.push(message);
      return;
    }

    sendMessageAction(message);
  }
}

function keyDownListender(event: KeyboardEvent) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
}

function cleanUpSocketListeners() {
  socket.removeEventListener("open", socketOpenEvent);
  socket.removeEventListener("close", socketCloseEvent);
  socket.removeEventListener("error", socketErrorEvent);
  socket.removeEventListener("message", socketReceiveMessageEvent);
  // @ts-ignore
  socket = null;
}

function socketOpenEvent() {
  const joinChatRoomRequest = JSON.stringify({
    action: "joinroom",
    RoomID,
  });

  socket.send(joinChatRoomRequest);
}

function socketReceiveMessageEvent(event: MessageEvent<any>) {
  const dataAction = JSON.parse(event.data);
  const action = dataAction.action;

  if (action === "joinroom") {
    // have loading state and remove loading state once room is joined for the first time.
    // check whether messages were saved from a disconnection. send them if there is any.
    if (savedMessages.length > 0) {
      for (let i = 0; i < savedMessages.length; i++) {
        sendMessageAction(savedMessages[i]);
      }
      savedMessages = [];
    }
  } else if (action === "sendmessage") {
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
}

function socketCloseEvent(e: CloseEvent) {
  console.log("socket closed. Attempting to reconnect. Reason", e.reason);
  cleanUpSocketListeners();
  setTimeout(connect, 1000);
}

function socketErrorEvent(error: Event) {
  console.log("socket Errored. Attempting to reconnect");
  cleanUpSocketListeners();
  setTimeout(connect, 1000);
}

button.addEventListener("click", sendMessage);
input.addEventListener("keydown", keyDownListender);

function connect() {
  const websocketURL = process.env.IS_DEV_SERVER
    ? "ws://localhost:8080"
    : `wss://websocket.chatvious.coding-wielder.com?access_token=${getCookie(
        "access_token"
      )}`;

  socket = new WebSocket(websocketURL);

  socket.addEventListener("open", socketOpenEvent);
  socket.addEventListener("message", socketReceiveMessageEvent);
  socket.addEventListener("close", socketCloseEvent);
  socket.addEventListener("error", socketErrorEvent);
}
connect();

// fetch old messages for pagination
async function newPaginationMessages() {
  const fetchNewMessagesData = JSON.stringify({
    RoomID,
    LastEvaluatedKey,
  });
  const newMessagesURL = "/rooms/fetchNewMessages";

  let newMessagesResponse: Response;
  try {
    newMessagesResponse = await fetch(newMessagesURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: fetchNewMessagesData,
    });
  } catch (error) {
    return { error: "Failed to Fetch more messages" };
  }

  if (!newMessagesResponse.ok) {
    const newMessagesError: BasicServerError = await newMessagesResponse.json();
    return { error: newMessagesError.error };
  }

  const newMessages: FetchNewMessagesSuccess = await newMessagesResponse.json();
  return newMessages;
}

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

// paginate messages to fetch new messages at top.
messagesContainer.addEventListener("scroll", async () => {
  if (messagesContainer.scrollTop === 0) {
    let newMessages: FetchNewMessagesSuccess | BasicServerError;
    if (LastEvaluatedKey) {
      newMessages = await newPaginationMessages();

      if ("error" in newMessages) {
        console.log(newMessages.error);
        return;
      } else if (newMessages.data.length <= 0) {
        LastEvaluatedKey = false;
        return;
      }

      const messages = newMessages.data;
      for (const message of messages) {
        const messageBoxOptions: MessageBoxEjsOptions = {
          userName: message.userName,
          RoomUserStatus: message.RoomUserStatus,
          profileColor: message.profileColor,
          message: message.message,
          messageId: message.messageId,
          messageDate: message.sentAt,
        };

        const newMessageBox = ejs.render(messageBoxEjs, messageBoxOptions);
        const newMessageBoxElement = document.createElement("div");
        newMessageBoxElement.innerHTML = newMessageBox;

        messagesContainer.insertBefore(
          newMessageBoxElement,
          messagesContainer.firstChild
        );
      }
      LastEvaluatedKey = newMessages.LastEvaluatedKey;
    }
  }
});
