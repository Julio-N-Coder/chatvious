package authorizer.tokens;

import com.fasterxml.jackson.jr.ob.JSON;
import authorizer.utils.BinaryUtils;
import authorizer.utils.HttpUtils;
import authorizer.utils.AWS4SignerBase;
import authorizer.utils.AWS4SignerForAuthorizationHeader;
import jakarta.enterprise.context.ApplicationScoped;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@ApplicationScoped
public class MinimalSsmClient {

    private final String ssmEndpointUrl;
    private String region;

    private final JSON json;

    public MinimalSsmClient() {
        this.json = JSON.std;

        this.ssmEndpointUrl = System.getenv("SSM_ENDPOINT_URL");
        this.region = System.getenv("REGION");
        if (this.region == null || this.region.isEmpty()) {
            this.region = "us-west-1";
        }
    }

    public String getParameter(String parameterName, boolean withDecryption) throws Exception {
        URI endpoint = new URI(determineEndpoint());

        Map<String, Object> requestBody = Map.of(
                "Name", parameterName,
                "WithDecryption", withDecryption);
        String jsonBody = json.asString(requestBody);

        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/x-amz-json-1.1");
        headers.put("X-Amz-Target", "AmazonSSM.GetParameter");

        String accessKeyId = System.getenv("AWS_ACCESS_KEY_ID");
        String secretAccessKey = System.getenv("AWS_SECRET_ACCESS_KEY");
        String sessionToken = System.getenv("AWS_SESSION_TOKEN");

        if (accessKeyId == null || secretAccessKey == null) {
            throw new RuntimeException("AWS credentials not found in Lambdaenvironment");
        }

        // Include session token for IAM role credentials
        if (sessionToken != null && !sessionToken.isEmpty()) {
            headers.put("X-Amz-Security-Token", sessionToken);
        }

        // Calculate body hash
        byte[] contentHash = AWS4SignerBase.hash(jsonBody);
        String contentHashString = BinaryUtils.toHex(contentHash);
        headers.put("x-amz-content-sha256", contentHashString);

        // Create signer and compute signature
        AWS4SignerForAuthorizationHeader signer = new AWS4SignerForAuthorizationHeader(
                endpoint.toURL(), "POST", "ssm", region);

        String authorization = signer.computeSignature(
                headers,
                null, // no query parameters for SSM
                contentHashString,
                accessKeyId,
                secretAccessKey);

        headers.put("Authorization", authorization);

        String response = HttpUtils.invokeHttpRequest(endpoint.toURL(), "POST", headers, jsonBody);
        return parseParameterValue(response);
    }

    private String parseParameterValue(String responseBody) throws Exception {
        // Parse response
        Map<String, Object> responseMap = json.mapFrom(responseBody);
        @SuppressWarnings("unchecked")
        Map<String, Object> parameter = (Map<String, Object>) responseMap.get("Parameter");

        if (parameter == null) {
            throw new RuntimeException("Parameter not found in response");
        }

        return (String) parameter.get("Value");
    }

    private String determineEndpoint() {
        if (ssmEndpointUrl != null && !ssmEndpointUrl.isEmpty()) {
            System.out.println("Using local endpoint: " + ssmEndpointUrl);
            return ssmEndpointUrl;
        } else {
            return "https://ssm." + region + ".amazonaws.com";
        }
    }
}
