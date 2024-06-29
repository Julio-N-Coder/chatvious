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

type MakeRoomReturnError = BaseModelsError;

type MakeRoomReturnSuccess = {
  message: string;
  statusCode: number;
};

type MakeRoomReturnType = Promise<MakeRoomReturnError | MakeRoomReturnSuccess>;

type RoomsOnUser =
  | { roomName: string; RoomID: string }[]
  | {
      roomName: string;
      RoomID: string;
      isAdmin: boolean;
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

type UserInfoDBResponse = UserInfo & {
  PartitionKey: `USER#${string}`;
  SortKey: "PROFILE";
};

type FetchUserInfoError = BaseModelsError;

type FetchUserInfoSuccess = {
  userInfo: UserInfo;
  statusCode: number;
};

type FetchUserInfoReturn = Promise<FetchUserInfoError | FetchUserInfoSuccess>;

type RoomMember = {
  userID: string;
  userName: string;
  RoomID: string;
  RoomUserStatus: "MEMBER" | "ADMIN" | "OWNER";
  joinedAt: string; // gsi sort key
  profileColor: string;
};

type RoomMemberDB = RoomMember & {
  PartitionKey: `ROOM#${string}`; // RoomID // gsi partition key
  SortKey: `MEMBERS#USERID#${string}`;
};

type FetchRoomMemberError = BaseModelsError;
type FetchRoomMemberSuccess = {
  roomMember: RoomMember;
  statusCode: number;
};

type FetchRoomMemberReturn = Promise<
  FetchRoomMemberError | FetchRoomMemberSuccess
>;

type FetchRoomMembersError = BaseModelsError;

type FetchRoomMembersSuccess = {
  roomMembers: RoomMember[];
  message: string;
  memberCount: number;
  statusCode: number;
};

type FetchRoomMembersReturn = Promise<
  FetchRoomMembersError | FetchRoomMembersSuccess
>;

type AddRoomMemberError = BaseModelsError;

type AddRoomMemberSuccess = {
  message: string;
  statusCode: number;
};

type AddRoomMemberReturn = Promise<AddRoomMemberError | AddRoomMemberSuccess>;

type RoomInfoType = {
  RoomID: string;
  roomName: string;
  createdAt: string;
};

type RoomInfoDBType = RoomInfoType & {
  PartitionKey: `ROOM#${string}`; // Room ID
  SortKey: `METADATA`;
};

type FetchRoomErrorReturn = BaseModelsError;

type FetchRoomSuccessReturn = {
  roomInfo: RoomInfoType;
  statusCode: number;
};

type FetchRoomReturn = Promise<FetchRoomErrorReturn | FetchRoomSuccessReturn>;

type SendJoinRequestError = BaseModelsError;

type SendJoinRequestSuccess = {
  message: string;
  statusCode: number;
};

type SendJoinRequestReturn = Promise<
  SendJoinRequestSuccess | SendJoinRequestError
>;

type JoinRequests = {
  RoomID: string;
  fromUserID: string;
  fromUserName: string;
  roomName: string;
  sentJoinRequestAt: string;
  profileColor: string;
}[];

type JoinRequestsDB = JoinRequests &
  {
    PartitionKey: `ROOM#${string}`; // RoomID
    SortKey: `JOIN_REQUESTS#DATE#${string}#USERID#${string}`;
  }[];

type FetchJoinRequestsError = BaseModelsError;

type FetchJoinRequestsSuccess = {
  message: string;
  joinRequests: JoinRequests;
  statusCode: number;
};

type FetchJoinRequestsReturn = Promise<
  FetchJoinRequestsError | FetchJoinRequestsSuccess
>;

type FetchNavJoinRequestsError = BaseModelsError;

type FetchNavJoinRequestsSuccess = {
  message: string;
  navJoinRequest: { RoomID: string; roomName: string }[] | [];
  statusCode: number;
};

type FetchNavJoinRequestsReturn = Promise<
  FetchNavJoinRequestsError | FetchNavJoinRequestsSuccess
>;

type RemoveJoinRequestError = BaseModelsError;

type RemoveJoinRequestSuccess = {
  message: string;
  statusCode: number;
};

type RemoveJoinRequestReturn = Promise<
  RemoveJoinRequestError | RemoveJoinRequestSuccess
>;

type UpdateJoinedRoomsError = BaseModelsError;
type UpdateJoinedRoomsSuccess = {
  message: string;
  statusCode: number;
};

type UpdateJoinedRoomsReturn = Promise<
  UpdateJoinedRoomsError | UpdateJoinedRoomsSuccess
>;

export {
  AuthCodeTokenResponse,
  TokenRefresh,
  RoomsOnUser,
  MakeRoomReturnType,
  RoomInfoDBType,
  RoomInfoType,
  RoomMemberDB,
  RoomMember,
  FetchRoomMemberReturn,
  FetchRoomMembersReturn,
  UserInfoDBResponse,
  UserInfo,
  FetchUserInfoReturn,
  FetchRoomReturn,
  SendJoinRequestReturn,
  JoinRequestsDB,
  FetchJoinRequestsReturn,
  FetchNavJoinRequestsReturn,
  RemoveJoinRequestReturn,
  AddRoomMemberReturn,
  UpdateJoinedRoomsReturn,
};
