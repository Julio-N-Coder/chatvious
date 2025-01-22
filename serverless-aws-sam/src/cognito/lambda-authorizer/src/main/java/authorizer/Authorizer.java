package authorizer;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;

interface Response {}

class Tokens {
    String refresh_token;
    String access_token;
    String id_token;
}

class CognitoData {
    String USER_POOL_ID = System.getenv("USER_POOL_ID");
    String CLIENT_ID = System.getenv("USER_POOL_CLIENT_ID");
    String COGNITO_DOMAIN = System.getenv("COGNITO_DOMAIN");
}

public class Authorizer implements RequestHandler<APIGatewayTokenAuthorizerEvent, Policy> {
  public Policy handleRequest(final APIGatewayTokenAuthorizerEvent input, final Context context) {
    String methodArn = input.getMethodArn();
    Tokens tokens = decomposeTokensString(input.getAuthorizationToken());

    // remember to make PolicyContext myself
    if (tokens.access_token != null) {
    } else if (tokens.refresh_token != null) {
    }
    return new Policy("Unauthorized", "Deny", methodArn, null);
  }

  private Tokens decomposeTokensString(String cookieString) {
    Tokens tokens = new Tokens();
    if (cookieString.length() < 1) {
        return tokens;
    }
    int found = 0;
    String[] tokenNames = {"refresh_token", "access_token", "id_token"};
    String[] cookies = cookieString.split(";");

    for (String cookie : cookies) {
        int startI = 0;
        if (cookie.charAt(0) == ' ') {
            startI = 1;
        }

        if (cookie.startsWith(tokenNames[0], startI)) {
            tokens.refresh_token = cookie.substring(tokenNames[0].length() + 1 + startI, cookie.length());
            found += 1;
        } else if (cookie.startsWith(tokenNames[1], startI)) {
            tokens.access_token = cookie.substring(tokenNames[1].length() + 1 + startI, cookie.length()); 
            found += 1;
        } else if (cookie.startsWith(tokenNames[2], startI)) {
            tokens.id_token = cookie.substring(tokenNames[2].length() + 1 + startI, cookie.length()); 
            found += 1;
        }
        if (found == tokenNames.length) {break;}
    }
    return tokens;
  }
}

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

class Policy implements Response {
    private String principalId; // The principal user ID
    private PolicyDocument policyDocument; // The policy document
    private Context context; // Additional context data

    Policy(String principalId, String effect, String methodArn, Context context) {
        this.principalId = principalId;
        this.policyDocument = new PolicyDocument(effect, methodArn);
        this.context = context;
    }

    // Getters and Setters
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
        private String Version = "2012-10-17"; // Fixed version
        private Statement[] Statement; // List of statements

        PolicyDocument(String effect, String methodArn) {
            Statement[] newStatement = new Statement[1];
            newStatement[0] = new Statement(effect, methodArn);
            this.Statement = newStatement;
        }

        // Getters and Setters
        public String getVersion() {
            return Version;
        }

        public void setVersion(String Version) {
            this.Version = Version;
        }

        public Statement[] getStatement() {
            return Statement;
        }

        public void setStatement(Statement[] Statement) {
            this.Statement = Statement;
        }

        // Inner class for Statement
        public static class Statement {
            private String Action = "execute-api:Invoke";
            private String Effect; // Allow or Deny
            private String Resource; // ARN of the resource

            Statement(String effect, String methodArn) {
                this.Effect = effect;
                this.Resource = methodArn;
            }

            // Getters and Setters
            public String getAction() {
                return Action;
            }

            public void setAction(String Action) {
                this.Action = Action;
            }

            public String getEffect() {
                return Effect;
            }

            public void setEffect(String Effect) {
                this.Effect = Effect;
            }

            public String getResource() {
                return Resource;
            }

            public void setResource(String Resource) {
                this.Resource = Resource;
            }
        }
    }

    public class Context {
        String sub;
        String username;
        String email;
        String iss;
        String client_id;
        String origin_jti;
        String event_id;
        String token_use;
        int auth_time;
        int exp;
        int iat;
        String  jti;
        String access_token;
        String id_token;
    }
}
