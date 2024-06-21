type roomInfoType = {
  RoomID: string;
  owner: { ownerID: string; ownerName: string };
  roomName: string;
  createdAt: string;
  authedUsers: { userID: string; username: string }[];
};

export { roomInfoType };
