type RoomsOnUser = { roomName: string; RoomID: string }[] | [];

type MakeRoomReturnError = {
  error: string;
  statusCode: number;
};

type MakeRoomReturnSuccess = {
  message: string;
  statusCode: number;
};

type MakeRoomReturnType = Promise<MakeRoomReturnError | MakeRoomReturnSuccess>;

type FetchRoomsOnUserError = {
  error: string;
  statusCode: number;
};

type FetchRoomsOnUserSuccess = {
  ownedRooms: RoomsOnUser;
  joinedRooms: RoomsOnUser;
  statusCode: number;
};

type RoomInfoType = {
  RoomID: string;
  owner: { ownerID: string; ownerName: string };
  roomName: string;
  createdAt: string;
  authedUsers: { userID: string; username: string }[] | [];
};

type FetchRoomsOnUserReturn = Promise<
  FetchRoomsOnUserError | FetchRoomsOnUserSuccess
>;

type FetchRoomErrorReturn = {
  error: string;
  statusCode: number;
};

type FetchRoomSuccessReturn = {
  roomInfo: RoomInfoType;
  statusCode: number;
};

type FetchRoomReturn = Promise<FetchRoomErrorReturn | FetchRoomSuccessReturn>;

export {
  RoomsOnUser,
  MakeRoomReturnType,
  RoomInfoType,
  FetchRoomsOnUserReturn,
  FetchRoomReturn,
};
