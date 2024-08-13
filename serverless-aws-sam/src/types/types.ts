type AuthCodeTokenResponse = {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

type TokenRefresh = {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
};

type BaseModelsError = {
  error: string;
  statusCode: number;
};

type BaseModelsSuccess = {
  message: string;
  statusCode: number;
};

interface BaseModelsSuccessData<Data> extends BaseModelsSuccess {
  data: Data;
}

type BaseModelsReturnType = Promise<BaseModelsError | BaseModelsSuccess>;

type BaseModelsReturnTypeData<Data> = Promise<
  BaseModelsError | BaseModelsSuccessData<Data>
>;

type RoomsOnUser =
  | {
      roomName: string;
      RoomID: string;
      isAdmin?: boolean;
    }[]
  | [];

type UserInfo = {
  userID: string;
  userName: string;
  email: string;
  ownedRooms: RoomsOnUser;
  joinedRooms: RoomsOnUser;
  profileColor: string;
};

interface UserInfoDBResponse extends UserInfo {
  PartitionKey: `USER#${string}`;
  SortKey: "PROFILE";
}

type FetchUserInfoSuccess = {
  userInfo: UserInfo;
  statusCode: number;
};

interface FetchRoomsOnUserData {
  ownedRooms?: RoomsOnUser;
  joinedRooms?: RoomsOnUser;
}

type FetchRoomsOnUserReturn = BaseModelsReturnTypeData<FetchRoomsOnUserData>;

interface CreateUserInfoSuccess extends BaseModelsSuccess {
  newUser: UserInfo;
}

type CreateUserInfoReturn = Promise<BaseModelsError | CreateUserInfoSuccess>;
type FetchUserInfoReturn = Promise<BaseModelsError | FetchUserInfoSuccess>;

interface BaseRoomMember {
  userID: string;
  userName: string;
  RoomID: string;
  RoomUserStatus: "MEMBER" | "ADMIN" | "OWNER";
  profileColor: string;
}

interface RoomMember extends BaseRoomMember {
  joinedAt: string; // ISODate
}

interface RoomMemberDB extends BaseRoomMember {
  PartitionKey: `ROOM#${string}`; // RoomID // gsi partition key
  SortKey: `MEMBERS#USERID#${string}`;
  GSISortKey: `MEMBERS#DATE#${string}`; // ISODate // gsi sort
}

type FetchRoomMemberSuccess = {
  roomMember: RoomMember;
  statusCode: number;
};

type FetchRoomMemberReturn = Promise<BaseModelsError | FetchRoomMemberSuccess>;

interface FetchRoomMembersSuccess extends BaseModelsSuccess {
  roomMembers: RoomMember[];
  memberCount: number;
}

type FetchRoomMembersReturn = Promise<
  BaseModelsError | FetchRoomMembersSuccess
>;

type RoomInfoType = {
  RoomID: string;
  roomName: string;
  createdAt: string;
};

type RoomInfoDBType = RoomInfoType & {
  PartitionKey: `ROOM#${string}`; // Room ID
  SortKey: `METADATA`;
};

interface FetchRoomSuccessReturn extends BaseModelsSuccess {
  roomInfo: RoomInfoType;
}

type FetchRoomReturn = Promise<BaseModelsError | FetchRoomSuccessReturn>;

interface BaseJoinRequest {
  RoomID: string;
  fromUserID: string;
  fromUserName: string;
  roomName: string;
  profileColor: string;
}

interface JoinRequest extends BaseJoinRequest {
  sentJoinRequestAt: string;
}

interface JoinRequestDB extends BaseJoinRequest {
  PartitionKey: `ROOM#${string}`; // RoomID
  SortKey: `JOIN_REQUESTS#USERID#${string}`;
  GSISortKey: `JOIN_REQUESTS#DATE#${string}`;
}
[];

interface FetchJoinRequestSuccess extends BaseModelsSuccess {
  joinRequest: JoinRequest;
}

type FetchJoinRequestReturn = Promise<
  BaseModelsError | FetchJoinRequestSuccess
>;

interface FetchJoinRequestsSuccess extends BaseModelsSuccess {
  joinRequests: JoinRequest[] | [];
}

type FetchJoinRequestsReturn = Promise<
  BaseModelsError | FetchJoinRequestsSuccess
>;

interface FetchNavJoinRequestsSuccess extends BaseModelsSuccess {
  navJoinRequest: { RoomID: string; roomName: string }[] | [];
}

type FetchNavJoinRequestsReturn = Promise<
  BaseModelsError | FetchNavJoinRequestsSuccess
>;

interface FetchNavUserInfoSuccess extends BaseModelsSuccess {
  data: {
    userName: string;
    profileColor: string;
    ownedRooms: RoomsOnUser;
    joinedRooms: RoomsOnUser;
    navJoinRequests:
      | []
      | {
          RoomID: string;
          roomName: string;
        }[];
  };
}

type FetchNavUserInfoReturn = Promise<
  BaseModelsError | FetchNavUserInfoSuccess
>;

type APIGatewayWebSocketAuthorizerEvent = {
  type: "REQUEST";
  methodArn: string;
  headers: { [key: string]: string; Connection: "upgrade" };
  multiValueHeaders: { [key: string]: string[] };
  queryStringParameters?: { [key: string]: string };
  multiValueQueryStringParameters?: { [key: string]: string[] };
  stageVariables?: { [key: string]: string };
  requestContext: {
    routeKey: "$connect";
    eventType: "CONNECT";
    extendedRequestId?: string;
    requestTime?: string;
    messageDirection: "IN";
    stage: string;
    connectedAt: number;
    requestTimeEpoch: number;
    identity: {
      sourceIp: string;
    };
    requestId: string;
    domainName: string;
    connectionId: string;
    apiId: string;
  };
};

interface APIGatewayWebSocketConnectEvent {
  headers: {
    [key: string]: string;
  };
  multiValueHeaders: {
    [key: string]: string[];
  };
  requestContext: {
    routeKey: string;
    eventType: "CONNECT";
    extendedRequestId: string;
    requestTime: string;
    messageDirection: string;
    stage: string;
    connectedAt: number;
    requestTimeEpoch: number;
    identity: {
      sourceIp: string;
    };
    requestId: string;
    domainName: string;
    connectionId: string;
    apiId: string;
    authorizer?: {
      claims: {
        sub: string;
        username: string;
        email: string;
        email_verified: boolean;
        phone_number: string;
        phone_number_verified: boolean;
        token_use: "access" | "id";
      };
      scopes: null;
    };
  };
  isBase64Encoded: boolean;
}

interface APIGatewayWebSocketDisconnectEvent {
  headers: {
    [key: string]: string;
  };
  multiValueHeaders: {
    [key: string]: string[];
  };
  requestContext: {
    routeKey: string;
    disconnectStatusCode: number;
    eventType: "DISCONNECT";
    extendedRequestId: string;
    requestTime: string;
    messageDirection: string;
    disconnectReason: string;
    stage: string;
    connectedAt: number;
    requestTimeEpoch: number;
    identity: {
      sourceIp: string;
    };
    requestId: string;
    domainName: string;
    connectionId: string;
    apiId: string;
  };
  isBase64Encoded: boolean;
}

interface InitialConnection {
  userID: string;
  connectionId: string; // sort key
  RoomID: string | false; // will be false if not connected to a room
}

interface InitialConnectionDB {
  PartitionKey: "CONNECTION_INFO"; // part key
  SortKey: string; // (sort key) connectionId
  userID: string;
  RoomID: string | false;
}

type InitialConnectionReturn = BaseModelsReturnTypeData<InitialConnection>;

interface RoomConnection {
  RoomID: string;
  connectionId: string;
  userID: string;
  userName: string;
  RoomUserStatus: "MEMBER" | "ADMIN" | "OWNER";
  profileColor: string;
}

interface RoomConnectionDB extends RoomConnection {
  PartitionKey: `ROOM#${string}`; // roomID
  SortKey: `CONNECTIONID#${string}`; // connectionID
}

type FetchRoomConnectionReturn = BaseModelsReturnTypeData<RoomConnection>;

type FetchAllRoomConnectionsReturn = BaseModelsReturnTypeData<RoomConnection[]>;

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

interface MessageKeys {
  PartitionKey: `ROOM#${string}`; // RoomID
  SortKey: `MESSAGES#DATE#${string}#MESSAGEID#${string}`;
}

type MessageDB = Message & MessageKeys;

type FetchMessageReturn = BaseModelsReturnTypeData<Message>;

type FetchAllMessagesReturn = BaseModelsReturnTypeData<Message[] | []>;

export {
  AuthCodeTokenResponse,
  TokenRefresh,
  BaseModelsReturnType,
  BaseModelsReturnTypeData,
  RoomsOnUser,
  RoomInfoDBType,
  RoomInfoType,
  RoomMemberDB,
  RoomMember,
  FetchRoomMemberReturn,
  FetchRoomMembersReturn,
  UserInfoDBResponse,
  UserInfo,
  FetchRoomsOnUserData,
  FetchRoomsOnUserReturn,
  CreateUserInfoReturn,
  FetchUserInfoReturn,
  FetchRoomReturn,
  JoinRequest,
  JoinRequestDB,
  FetchJoinRequestReturn,
  FetchJoinRequestsReturn,
  FetchNavJoinRequestsReturn,
  FetchNavUserInfoReturn,
  APIGatewayWebSocketAuthorizerEvent,
  APIGatewayWebSocketConnectEvent,
  APIGatewayWebSocketDisconnectEvent,
  InitialConnection,
  InitialConnectionDB,
  InitialConnectionReturn,
  RoomConnectionDB,
  FetchRoomConnectionReturn,
  FetchAllRoomConnectionsReturn,
  Message,
  MessageKeys,
  MessageDB,
  FetchMessageReturn,
  FetchAllMessagesReturn,
};
