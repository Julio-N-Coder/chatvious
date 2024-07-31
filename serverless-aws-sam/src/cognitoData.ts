export default {
  USER_POOL_NAME: "Chatvious-UserPool",
  APP_CLIENT_NAME: "Chatvious-appclient",
  USER_POOL_ID: "us-west-1_iJn1nk3N1",
  CLIENT_ID: "jet3kkqp4jnkm1v3ta7htu75g",
  CALLBACK_URL: "http://localhost:3000/callback",
  SIGN_OUT_URL: "http://localhost:3000",

  JWKS_URL:
    "https://cognito-idp.us-west-1.amazonaws.com/us-west-1_iJn1nk3N1/.well-known/jwks.json",

  COGNITO_DOMAIN: "https://chatvious.auth.us-west-1.amazoncognito.com",

  LOGIN_URL:
    "https://chatvious.auth.us-west-1.amazoncognito.com/login?response_type=code&client_id=jet3kkqp4jnkm1v3ta7htu75g&redirect_uri=http://localhost:3000/callback",

  SIGNUP_URL:
    "https://chatvious.auth.us-west-1.amazoncognito.com/signup?response_type=code&client_id=jet3kkqp4jnkm1v3ta7htu75g&redirect_uri=http://localhost:3000/callback",
};
