import { APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import ejs from "ejs";
import fetchNavUserInfo from "../../lib/navUserInfo.js";
import { isProduction, addSetCookieHeaders } from "../../lib/handyUtils.js";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Rendering Dashboard");
  const userID = event.requestContext.authorizer?.claims.sub as string;

  const navUserInfoResponse = await fetchNavUserInfo(userID);
  if ("error" in navUserInfoResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: navUserInfoResponse.statusCode,
      body: JSON.stringify({ error: navUserInfoResponse.error }),
    };
  }

  const userInfo = navUserInfoResponse.data;
  const dashboardHTML = await ejs.renderFile("../../views/dashboard.ejs", {
    ownedRooms: userInfo.ownedRooms,
    joinedRooms: userInfo.joinedRooms,
    username: userInfo.userName,
    profileColor: userInfo.profileColor,
    navJoinRequest: userInfo.navJoinRequests,
    isProduction: isProduction() ? true : false,
  });

  // having a problem with js not running in browser. try to set cors to own localhost port and 8000 port
  // cors not set up yet
  const baseSuccess: APIGatewayProxyResult = {
    isBase64Encoded: false,
    headers: {
      "Content-Type": "text/html",
      // "Access-Control-Allow-Origin": process.env.SUB_DOMAIN as string,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Cookie",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      "Access-Control-Allow-Credentials": "true",
    },
    statusCode: 200,
    body: dashboardHTML,
  };

  const baseSuccessWCookies = await addSetCookieHeaders(event, baseSuccess);

  return baseSuccessWCookies;
};
