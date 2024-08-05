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

type BaseModelsReturnType = Promise<BaseModelsError | BaseModelsSuccess>;

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

interface CreateUserInfoSuccess {
  message: string;
  statusCode: number;
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

type FetchRoomMembersSuccess = {
  roomMembers: RoomMember[];
  message: string;
  memberCount: number;
  statusCode: number;
};

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

type FetchRoomSuccessReturn = {
  roomInfo: RoomInfoType;
  message: string;
  statusCode: number;
};

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

type FetchJoinRequestsSuccess = {
  message: string;
  joinRequests: JoinRequest[] | [];
  statusCode: number;
};

type FetchJoinRequestsReturn = Promise<
  BaseModelsError | FetchJoinRequestsSuccess
>;

type FetchNavJoinRequestsSuccess = {
  message: string;
  navJoinRequest: { RoomID: string; roomName: string }[] | [];
  statusCode: number;
};

type FetchNavJoinRequestsReturn = Promise<
  BaseModelsError | FetchNavJoinRequestsSuccess
>;

interface FetchNavUserInfoSuccess {
  statusCode: number;
  message: string;
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

export {
  AuthCodeTokenResponse,
  TokenRefresh,
  BaseModelsReturnType,
  RoomsOnUser,
  RoomInfoDBType,
  RoomInfoType,
  RoomMemberDB,
  RoomMember,
  FetchRoomMemberReturn,
  FetchRoomMembersReturn,
  UserInfoDBResponse,
  UserInfo,
  CreateUserInfoReturn,
  FetchUserInfoReturn,
  FetchRoomReturn,
  JoinRequest,
  JoinRequestDB,
  FetchJoinRequestsReturn,
  FetchNavJoinRequestsReturn,
  FetchNavUserInfoReturn,
  APIGatewayWebSocketConnectEvent,
  APIGatewayWebSocketDisconnectEvent,
};
