import { Request, Response } from "express";
import { TokenResponse } from "../types/Cognito-types.js";
import cognitoData from "../cognitoData.js";
import { isProduction } from "../lib/handyUtils.js";

// In Callback, check is sub(basically id) value in id token to see if user already has data in database.
// If not, store their information and continue.

async function callback(req: Request, res: Response): Promise<void> {
  // Authorization code is checked and sent to the token endpoint
  if (req.query.code && typeof req.query.code === "string") {
    let tokenEndpointURL = `${cognitoData.COGNITO_DOMAIN}/oauth2/token`;
    let authCode = req.query.code;

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: cognitoData.CLIENT_ID as string,
      code: authCode,
      redirect_uri: isProduction()
        ? "Not set up yet"
        : cognitoData.CALLBACK_URL,
    });

    const tokens = await fetch(tokenEndpointURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!tokens.ok) {
      console.log(tokens);
      res.send("Error While trying to log in");
    }

    const {
      access_token,
      id_token,
      refresh_token,
      token_type,
      expires_in,
    }: TokenResponse = await tokens.json();
    const refresh_token_expiration_days = 365;

    // do database look up here

    // Add check to make tokens secure true in production
    res.cookie("access_token", access_token, {
      httpOnly: false,
      secure: false,
      expires: new Date(Date.now() + expires_in * 1000),
    });
    res.cookie("id_token", id_token, {
      httpOnly: false,
      secure: false,
      expires: new Date(Date.now() + expires_in * 1000),
    });
    res.cookie("refresh_token", refresh_token, {
      httpOnly: false,
      secure: false,
      expires: new Date(Date.now() + refresh_token_expiration_days * 86400000),
    });

    return res.redirect(`/dashboard`);
  }
  res.status(400).send("Bad response");
}

export { callback };
