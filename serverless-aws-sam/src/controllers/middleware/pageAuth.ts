import { Request, Response, NextFunction } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { decomposeUnverifiedJwt } from "aws-jwt-verify/jwt";
import cognitoData from "../../cognitoData.js";
import { TokenRefresh } from "../../types/types.js";

async function pageAuth(req: Request, res: Response, next: NextFunction) {
  const access_token = req.cookies.access_token;
  const refresh_token = req.cookies.refresh_token;

  // verify token in cookie if there is one
  if (access_token) {
    try {
      const verifier = CognitoJwtVerifier.create({
        userPoolId: cognitoData.USER_POOL_ID,
        tokenUse: "access",
        clientId: cognitoData.CLIENT_ID,
      });

      const payload = await verifier.verify(access_token);
      req.user = { id: payload.sub };
      return next();
    } catch (err) {
      return res.redirect(
        `${cognitoData.COGNITO_DOMAIN}/login?response_type=code&client_id=${cognitoData.CLIENT_ID}&redirect_uri=${cognitoData.CALLBACK_URL}`
      );
    }
    // check for a refresh token to and fetch new cookies
  } else if (refresh_token) {
    try {
      const tokenResponse = await fetch(
        `${cognitoData.COGNITO_DOMAIN}/oauth2/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `grant_type=refresh_token&client_id=jet3kkqp4jnkm1v3ta7htu75g&refresh_token=${refresh_token}`,
        }
      );
      // check response status
      if (!tokenResponse.ok) {
        return res.redirect(
          `${cognitoData.COGNITO_DOMAIN}/login?response_type=code&client_id=${cognitoData.CLIENT_ID}&redirect_uri=${cognitoData.CALLBACK_URL}`
        );
      }
      const tokenData: TokenRefresh = await tokenResponse.json();

      // Add check to make tokens secure true in production
      res.cookie("access_token", tokenData.access_token, {
        httpOnly: false,
        secure: false,
        expires: new Date(Date.now() + tokenData.expires_in * 1000),
      });
      res.cookie("id_token", tokenData.id_token, {
        httpOnly: false,
        secure: false,
        expires: new Date(Date.now() + tokenData.expires_in * 1000),
      });

      const { payload } = decomposeUnverifiedJwt(tokenData.id_token);

      if (typeof payload.sub === "string") {
        req.user = { id: payload.sub };
      } else {
        res.status(500).send("Internal Server Error");
      }

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
