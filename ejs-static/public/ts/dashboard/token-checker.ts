import { setCookie, getCookie } from "../utilities/cookies";
import { TokenRefresh } from "../types";

const client_id = process.env.USER_POOL_CLIENT_ID;
const cognito_domain_url = process.env.COGNITO_DOMAIN_URL;

// handle sign out error to show ui a problem.
async function signOut() {
  const refresh_token = getCookie("refresh_token");

  try {
    const response = await fetch(`${cognito_domain_url}/oauth2/revoke`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `token=${refresh_token}&client_id=${client_id}`,
    });

    if (response.ok === true) {
      document.cookie =
        "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "id_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      const redirect_uri = process.env.SUB_DOMAIN_URL as string;

      window.location.href = redirect_uri;
    }
  } catch (error) {
    // handle error and display it to ui
    console.log(error);
  }
}

// once in a while, check if tokens are expired and refresh it
let tokenCheckerIntervalMinutes = 5;
setInterval(async () => {
  const access_token = getCookie("access_token");

  if (access_token) {
    const decoded = atob(access_token.split(".")[1]);
    const access_token_data = JSON.parse(decoded);
    const expiration = access_token_data.exp;
    const currentDate = Math.floor(new Date().getTime() / 1000);
    const expiresIn = expiration - currentDate;

    if (!(expiresIn <= 600)) {
      return;
    }
    const refresh_token = getCookie("refresh_token");

    try {
      const tokenResponse = await fetch(`${cognito_domain_url}/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=refresh_token&client_id=${client_id}&refresh_token=${refresh_token}`,
      });
      const tokenData: TokenRefresh = await tokenResponse.json();

      setCookie("access_token", tokenData.access_token, tokenData.expires_in);
      setCookie("id_token", tokenData.id_token, tokenData.expires_in);
    } catch (error) {
      console.log(error);
    }
  }
}, tokenCheckerIntervalMinutes * 60000);

export { signOut };
