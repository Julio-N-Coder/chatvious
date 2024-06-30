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

type BasicServerResponse = BasicServerError | BasicServerSuccess;

export {
  TokenRefresh,
  BasicServerError,
  BasicServerSuccess,
  BasicServerResponse,
};
