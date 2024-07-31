import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

// Route not set up yet
export async function handler(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  return {
    headers: { "Content-Type": "application/json" },
    statusCode: 200,
    body: JSON.stringify({
      message: "Left the room (Route not set up yet)",
    }),
  };
}
