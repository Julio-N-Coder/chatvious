import { Request, Response, NextFunction } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import cognitoData from "../../cognitoData.js";

async function pageAuth(req: Request, res: Response, next: NextFunction) {
  const access_token = req.cookies.access_token;
  const url_access_token = req.query.access_token;

  // verify token in cookie if there is one
  if (access_token) {
    try {
      const verifier = CognitoJwtVerifier.create({
        userPoolId: cognitoData.USER_POOL_ID,
        tokenUse: "access",
        clientId: cognitoData.CLIENT_ID,
      });

      const payload = await verifier.verify(access_token);
      return next();
    } catch (err) {
      return res.redirect(
        `${cognitoData.COGNITO_DOMAIN}/login?response_type=code&client_id=${cognitoData.CLIENT_ID}&redirect_uri=${cognitoData.CALLBACK_URL}`
      );
    }
    // verify token in url if there is one
  } else if (typeof url_access_token === "string") {
    try {
      const verifier = CognitoJwtVerifier.create({
        userPoolId: cognitoData.USER_POOL_ID,
        tokenUse: "access",
        clientId: cognitoData.CLIENT_ID,
      });

      const payload = await verifier.verify(url_access_token);
      return next();
    } catch (err) {
      return res.redirect(
        `${cognitoData.COGNITO_DOMAIN}/login?response_type=code&client_id=${cognitoData.CLIENT_ID}&redirect_uri=${cognitoData.CALLBACK_URL}`
      );
    }
  }

  return res.redirect(
    `${cognitoData.COGNITO_DOMAIN}/login?response_type=code&client_id=${cognitoData.CLIENT_ID}&redirect_uri=${cognitoData.CALLBACK_URL}`
  );
}

export default pageAuth;
