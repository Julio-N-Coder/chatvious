package authorizer.tokens;

import com.fasterxml.jackson.jr.ob.JSON;
import jakarta.enterprise.context.ApplicationScoped;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@ApplicationScoped
public class MinimalSsmClient {

    private final String ssmEndpointUrl;
    private String region;

    private final HttpClient httpClient;
    private final JSON json;

    public MinimalSsmClient() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.json = JSON.std;

        // Read environment variables directly
        this.ssmEndpointUrl = System.getenv("SSM_ENDPOINT_URL");
        this.region = System.getenv("REGION");
        if (this.region == null || this.region.isEmpty()) {
            this.region = "us-west-1"; // default
        }
    }

    public String getParameter(String parameterName, boolean withDecryption) throws Exception {
        String endpoint = determineEndpoint();

        // Create the request body
        Map<String, Object> requestBody = Map.of(
                "Name", parameterName,
                "WithDecryption", withDecryption);

        String jsonBody = json.asString(requestBody);

        // Build HTTP request
        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/x-amz-json-1.1")
                .header("X-Amz-Target", "AWSSimpleSystemsManagement.GetParameter")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody));

        HttpRequest request = requestBuilder.build();

        // Send request
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException(
                    "SSM request failed with status: " + response.statusCode() + ", body: " + response.body());
        }

        // Parse response
        Map<String, Object> responseMap = json.mapFrom(response.body());
        @SuppressWarnings("unchecked")
        Map<String, Object> parameter = (Map<String, Object>) responseMap.get("Parameter");

        if (parameter == null) {
            System.err.println("Parameter not found in response");

            throw new RuntimeException("Parameter not found in response");
        }

        return (String) parameter.get("Value");
    }

    private String determineEndpoint() {
        if (ssmEndpointUrl != null && !ssmEndpointUrl.isEmpty()) {
            System.out.println("Using local endpoint: " + ssmEndpointUrl);
            return ssmEndpointUrl;
        } else {
            return "https://ssm." + region + ".amazonaws.com/";
        }
    }
}
