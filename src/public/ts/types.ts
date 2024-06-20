type TokenRefresh = {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
};

type makeRoomResponse = { error: string } | { message: string };

export { TokenRefresh, makeRoomResponse };
