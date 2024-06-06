import { Request, Response } from "express";
import { TokenResponse } from "../types/Cognito-types.js";
import cognitoData from "../cognitoData.js";
import { isProduction } from "../lib/handyUtils.js";

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

    // Try to remove tokens from url in client
    return res.redirect(
      `/dashboard?access_token=${access_token}&id_token=${id_token}&refresh_token=${refresh_token}&token_type=${token_type}&expires_in=${expires_in}`
    );
  }
  res.status(400).send("Bad response");
}

export { callback };
