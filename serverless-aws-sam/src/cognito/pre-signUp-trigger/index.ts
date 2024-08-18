import { PreSignUpTriggerEvent } from "aws-lambda";

export const handler = async (event: PreSignUpTriggerEvent) => {
  if (event.userName.length < 3) {
    throw new Error("Username must be at least 3 characters long");
  } else if (event.userName.length > 20) {
    throw new Error("Username must be at most 20 characters long");
  }

  return event;
};
