import { APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import ejs from "ejs";
import fetchNavUserInfo from "../../lib/navUserInfo.js";
import { isProduction, addSetCookieHeaders } from "../../lib/handyUtils.js";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const userID = event.requestContext.authorizer?.sub as string;

  const navUserInfoResponse = await fetchNavUserInfo(userID);
  if ("error" in navUserInfoResponse) {
    console.log("fetch user error: userID: ", userID);
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: navUserInfoResponse.statusCode,
      body: JSON.stringify({ error: navUserInfoResponse.error }),
    };
  }

  const staticContentUrl =
    process.env.SUB_DOMAIN_URL || "https://main.chatvious.coding-wielder.com";
  const domainUrl =
    process.env.DOMAIN_URL || "https://chatvious.coding-wielder.com";
  const userInfo = navUserInfoResponse.data;
  const dashboardHTML = await ejs.renderFile("./views/dashboard.ejs", {
    ownedRooms: userInfo.ownedRooms,
    joinedRooms: userInfo.joinedRooms,
    username: userInfo.userName,
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
    body: dashboardHTML,
  };

  const baseSuccessWCookies = await addSetCookieHeaders(event, baseSuccess);

  return baseSuccessWCookies;
};
