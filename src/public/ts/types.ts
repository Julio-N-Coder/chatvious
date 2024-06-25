type TokenRefresh = {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
};

type MakeRoomResponse = { error: string } | { message: string };

type JoinRoomResponse = { error: string } | { message: string };

export { TokenRefresh, MakeRoomResponse, JoinRoomResponse };
