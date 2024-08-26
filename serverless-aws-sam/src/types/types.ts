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

interface BaseModelsSuccessKey<Data, Keys> extends BaseModelsSuccessData<Data> {
  LastEvaluatedKey: Keys | undefined;
}

type BaseModelsReturnType = Promise<BaseModelsError | BaseModelsSuccess>;

type BaseModelsReturnTypeData<Data> = Promise<
  BaseModelsError | BaseModelsSuccessData<Data>
>;

type BaseModelsReturnDataKey<Data, Keys> = Promise<
  BaseModelsError | BaseModelsSuccessKey<Data, Keys>
>;

interface BaseKeys {
  PartitionKey: string;
  SortKey: string;
}

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

interface RoomMemberKeys {
  PartitionKey: `ROOM#${string}`; // RoomID
  SortKey: `MEMBERS#USERID#${string}`;
}

type RoomMemberDB = BaseRoomMember &
  RoomMemberKeys & {
    GSISortKey: `MEMBERS#DATE#${string}`; // ISODate
  };

type FetchRoomMemberSuccess = {
  roomMember: RoomMember;
  statusCode: number;
};

type FetchRoomMemberReturn = Promise<BaseModelsError | FetchRoomMemberSuccess>;

interface FetchRoomMembersSuccess extends BaseModelsSuccess {
  roomMembers: RoomMember[];
  memberCount: number;
  LastEvaluatedKey: RoomMemberKeys | undefined;
}

interface FetchRoomMembersKeysSuccess extends BaseModelsSuccess {
  roomMembersKeys: RoomMemberKeys[];
  memberCount: number;
  LastEvaluatedKey: RoomMemberKeys | undefined;
}

type FetchRoomMembersReturn = Promise<
  BaseModelsError | FetchRoomMembersKeysSuccess | FetchRoomMembersSuccess
>;

type RoomInfoType = {
  RoomID: string;
  roomName: string;
  createdAt: string;
  roomMemberCount: number;
};

interface RoomInfoKeys {
  PartitionKey: `ROOM#${string}`; // RoomID
  SortKey: `METADATA`;
}

type RoomInfoDBType = RoomInfoType & RoomInfoKeys;

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

interface JoinRequestKeys {
  PartitionKey: `ROOM#${string}`; // RoomID
  SortKey: `JOIN_REQUESTS#USERID#${string}`;
}

type JoinRequestDB = BaseJoinRequest &
  JoinRequestKeys & {
    GSISortKey: `JOIN_REQUESTS#DATE#${string}`;
  };
[];

interface FetchJoinRequestSuccess extends BaseModelsSuccess {
  joinRequest: JoinRequest;
}

type FetchJoinRequestReturn = Promise<
  BaseModelsError | FetchJoinRequestSuccess
>;

interface FetchJoinRequestsSuccess extends BaseModelsSuccess {
  joinRequests: JoinRequest[] | [];
  LastEvaluatedKey: JoinRequestKeys | undefined;
}

interface FetchJoinRequestsKeysSuccess extends BaseModelsSuccess {
  joinRequestsKeys: JoinRequestKeys[] | [];
  LastEvaluatedKey: JoinRequestKeys | undefined;
}

type FetchJoinRequestsReturn = Promise<
  BaseModelsError | FetchJoinRequestsSuccess | FetchJoinRequestsKeysSuccess
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
    email: string;
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

interface LambdaAuthorizerClaims {
  [stringKey: string]: string | number;
  sub: string;
  username: string;
  email: string;
  iss: string;
  client_id: string;
  origin_jti: string;
  event_id: string;
  token_use: "access" | "id";
  auth_time: number;
  exp: number;
  iat: number;
  jti: string;
}

type PostConfirmationEvent = {
  version: string;
  triggerSource: string;
  region: string;
  userPoolId: string;
  userName: string;
  callerContext: {
    awsSdkVersion: string;
    clientId: string;
  };
  request: {
    userAttributes: {
      // [key: string]: string;
      sub: string;
      email: string;
      email_verified: string;
      phone_number_verified: string;
      phone_number: string;
    };
    confirmationCode?: string;
    clientMetadata?: {
      [key: string]: string;
    };
  };
  response: {
    autoConfirmUser?: boolean;
    autoVerifyEmail?: boolean;
    autoVerifyPhone?: boolean;
    smsMessage?: string;
    emailMessage?: string;
    emailSubject?: string;
  };
};

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
    authorizer?: LambdaAuthorizerClaims;
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
  expires: number; // ttl
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
  expires: number; // ttl
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

interface RoomMessagesPaginateBy20Success
  extends BaseModelsSuccessData<Message[] | []> {
  LastEvaluatedKey?: MessageKeys;
}

type RoomMessagesPaginateBy20Return = Promise<
  RoomMessagesPaginateBy20Success | BaseModelsError
>;

type FetchMessageReturn = BaseModelsReturnTypeData<Message>;

type FetchAllMessagesReturn = BaseModelsReturnDataKey<
  Message[] | [],
  MessageKeys
>;

export {
  AuthCodeTokenResponse,
  TokenRefresh,
  BaseModelsReturnType,
  BaseModelsReturnTypeData,
  BaseKeys,
  RoomsOnUser,
  RoomInfoKeys,
  RoomInfoDBType,
  RoomInfoType,
  RoomMemberKeys,
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
  JoinRequestKeys,
  JoinRequestDB,
  FetchJoinRequestReturn,
  FetchJoinRequestsReturn,
  FetchNavJoinRequestsReturn,
  FetchNavUserInfoReturn,
  PostConfirmationEvent,
  LambdaAuthorizerClaims,
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
  RoomMessagesPaginateBy20Return,
  FetchAllMessagesReturn,
};
