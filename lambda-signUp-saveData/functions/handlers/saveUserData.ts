import { PostConfirmationEvent } from "../types.js";

// comamnd to invoke "sam local invoke saveUserDataFunction -e events/event.json"
export const saveUserData = async (event: PostConfirmationEvent) => {
  // All log statements are written to CloudWatch
  console.info(`Some Logging Info`);

  return event;
};
