import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import cookie from "cookie";
import { AuthCodeTokenResponse } from "../../types/types.js";

export async function handler(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  const cognitoData = {
    COGNITO_DOMAIN: process.env.COGNITO_DOMAIN as string,
    CLIENT_ID: process.env.USER_POOL_CLIENT_ID as string,
    CALLBACK_URL: process.env.CALLBACK_URL as string,
  };

  // Authorization code is checked and sent to the token endpoint
  if (
    event.queryStringParameters?.code &&
    typeof event.queryStringParameters.code === "string"
  ) {
    let tokenEndpointURL = `${cognitoData.COGNITO_DOMAIN}/oauth2/token`;
    let authCode = event.queryStringParameters.code;

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: cognitoData.CLIENT_ID,
      code: authCode,
      redirect_uri: cognitoData.CALLBACK_URL,
    });

    try {
      const tokens = await fetch(tokenEndpointURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!tokens.ok) {
        console.log(tokens);
        return {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
            "Access-Control-Allow-Credentials": "true",
          },
          statusCode: 400,
          body: JSON.stringify({ error: "Error While trying to log in" }),
        };
      }

      const {
        access_token,
        id_token,
        refresh_token,
        token_type,
        expires_in,
      }: AuthCodeTokenResponse = await tokens.json();
      const refresh_token_expiration_days = 365;

      const domain = process.env.DOMAIN;
      const domainURL = process.env.DOMAIN_URL;

      const secure = process.env.IS_LOCAL_SERVER === "false";
      const cookieExpires = new Date(Date.now() + expires_in * 1000);

      const access_token_cookie = cookie.serialize(
        "access_token",
        access_token,
        {
          httpOnly: false,
          secure,
          path: "/",
          domain,
          expires: cookieExpires,
        }
      );
      const id_token_cookie = cookie.serialize("id_token", id_token, {
        httpOnly: false,
        secure,
        path: "/",
        domain,
        expires: cookieExpires,
      });
      const refresh_token_cookie = cookie.serialize(
        "refresh_token",
        refresh_token,
        {
          httpOnly: false,
          secure,
          path: "/",
          domain,
          expires: new Date(
            Date.now() + refresh_token_expiration_days * 86400000
          ),
        }
      );

      return {
        multiValueHeaders: {
          "Set-Cookie": [
            access_token_cookie,
            id_token_cookie,
            refresh_token_cookie,
          ],
        },
        headers: {
          Location: `${domainURL}/dashboard`,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        },
        statusCode: 302,
        body: "",
      };
    } catch (error) {
      return {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        },
        statusCode: 500,
        body: JSON.stringify({ error: "Error While trying to log in" }),
      };
    }
  }
  return {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
    statusCode: 400,
    body: JSON.stringify({ error: "Error While trying to log in" }),
  };
}
