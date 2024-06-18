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
      // [key: string]: string;
      sub: string,
      email: string,
      email_verified: string,
      phone_number_verified: string,
      phone_number: string
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
