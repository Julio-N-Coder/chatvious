type TokenRefresh = {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
};

type BasicServerError = {
  error: string;
};

type BasicServerSuccess = {
  message: string;
};

interface BasicServerSuccessData<Data> extends BasicServerSuccess {
  data: Data;
}

type BasicServerResponse = BasicServerError | BasicServerSuccess;

interface sendMessageAction {
  action: "sendmessage";
  sender: {
    userName: string;
    RoomUserStatus: "MEMBER" | "ADMIN" | "OWNER";
    profileColor: string;
  };
  message: string;
  messageId: string;
  messageDate: string;
}

interface MessageBoxEjsOptions {
  userName: string;
  RoomUserStatus: "MEMBER" | "ADMIN" | "OWNER";
  profileColor: string;
  message: string;
  messageId: string;
  messageDate: string;
}

interface MessagePaginationKeys {
  PartitionKey: `ROOM#${string}`; // RoomID
  SortKey: `MESSAGES#DATE#${string}#MESSAGEID#${string}`;
}

interface Message {
  message: string;
  messageId: string;
  userID: string;
  userName: string;
  RoomUserStatus: "MEMBER" | "ADMIN" | "OWNER";
  profileColor: string;
  RoomID: string;
  sentAt: string;
}

interface FetchNewMessagesSuccess
  extends BasicServerSuccessData<Message[] | []> {
  LastEvaluatedKey: MessagePaginationKeys | false;
}

export {
  TokenRefresh,
  BasicServerError,
  BasicServerSuccess,
  BasicServerResponse,
  sendMessageAction,
  MessageBoxEjsOptions,
  MessagePaginationKeys,
  FetchNewMessagesSuccess,
};
