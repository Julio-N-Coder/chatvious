import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import fetchNavUserInfo from "../../lib/navUserInfo.js";
import { isProduction, addSetCookieHeaders } from "../../lib/handyUtils.js";
import ejs from "ejs";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userID = event.requestContext.authorizer?.sub as string;

  const navUserInfoResponse = await fetchNavUserInfo(userID);
  if ("error" in navUserInfoResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: navUserInfoResponse.statusCode,
      body: JSON.stringify({ error: navUserInfoResponse.error }),
    };
  }

  const userInfo = navUserInfoResponse.data;
  const staticContentUrl =
    process.env.SUB_DOMAIN_URL || "https://main.chatvious.coding-wielder.com";
  const domainUrl =
    process.env.DOMAIN_URL || "https://chatvious.coding-wielder.com";
  const profilePageHTML = await ejs.renderFile("./views/profilePage.ejs", {
    username: userInfo.userName,
    email: userInfo.email,
    profileColor: userInfo.profileColor,
    navJoinRequest: userInfo.navJoinRequests,
    isProduction: isProduction(),
    staticContentUrl,
    domainUrl,
  });

  const baseSuccess: APIGatewayProxyResult = {
    isBase64Encoded: false,
    headers: {
      "Content-Type": "text/html",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Cookie",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
    statusCode: 200,
    body: profilePageHTML,
  };

  const baseSuccessWCookies = await addSetCookieHeaders(event, baseSuccess);
  return baseSuccessWCookies;
};
