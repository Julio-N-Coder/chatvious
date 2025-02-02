package authorizer;

class APIGatewayTokenAuthorizerEvent {
  private String type;
  private String authorizationToken;
  private String methodArn;

  public String getType() {
      return type;
  }

  public void setType(String type) {
      this.type = type;
  }

  public String getAuthorizationToken() {
      return authorizationToken;
  }

  public void setAuthorizationToken(String authorizationToken) {
      this.authorizationToken = authorizationToken;
  }

  public String getMethodArn() {
      return methodArn;
  }

  public void setMethodArn(String methodArn) {
      this.methodArn = methodArn;
  }
}

class Policy {
    private String principalId; // The principal user ID
    private PolicyDocument policyDocument;
    private Context context; // Additional context data

    Policy(String principalId, String effect, String methodArn, Context context) {
        this.principalId = principalId;
        this.policyDocument = new PolicyDocument(effect, methodArn);
        this.context = context;
    }

    public String getPrincipalId() {
        return principalId;
    }

    public void setPrincipalId(String principalId) {
        this.principalId = principalId;
    }

    public PolicyDocument getPolicyDocument() {
        return policyDocument;
    }

    public void setPolicyDocument(PolicyDocument policyDocument) {
        this.policyDocument = policyDocument;
    }

    public Context getContext() {
        return context;
    }

    public void setContext(Context context) {
        this.context = context;
    }

    // Inner class for PolicyDocument
    public static class PolicyDocument {
        public String Version = "2012-10-17";
        public Statement[] Statement;

        PolicyDocument(String effect, String methodArn) {
            Statement[] newStatement = new Statement[1];
            newStatement[0] = new Statement(effect, methodArn);
            this.Statement = newStatement;
        }

        // Inner class for Statement
        public static class Statement {
            public String Action = "execute-api:Invoke";
            public String Effect; // Allow or Deny
            public String Resource; // ARN of the resource

            Statement(String effect, String methodArn) {
                this.Effect = effect;
                this.Resource = methodArn;
            }
        }
    }

    public static class Context {
        public String sub;
        public String username;
        public String email = "";
        public String iss;
        public String client_id;
        public String origin_jti;
        public String event_id;
        public String token_use;
        public int auth_time;
        public long exp;
        public long iat;
        public String  jti;
        public String access_token;
        public String id_token;
    }
}
