type PostConfirmationEvent = {
  version: string;
  triggerSource: string;
  region: string;
  userPoolId: string;
  userName: string;
  callerContext: {
    awsSdkVersion: string;
    clientId: string;
  };
  request: {
    userAttributes: {
      [key: string]: string;
    };
    confirmationCode?: string;
    clientMetadata?: {
      [key: string]: string;
    };
  };
  response: {
    autoConfirmUser?: boolean;
    autoVerifyEmail?: boolean;
    autoVerifyPhone?: boolean;
    smsMessage?: string;
    emailMessage?: string;
    emailSubject?: string;
  };
};

export { PostConfirmationEvent };
