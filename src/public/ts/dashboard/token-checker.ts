import { setCookie, getCookie } from "../utilities/cookies";
import { TokenRefresh } from "../types";

// handle sign out error to show ui a problem.
async function signOut() {
  const refresh_token = getCookie("refresh_token");

  try {
    const response = await fetch(
      "https://chatvious.auth.us-west-1.amazoncognito.com/oauth2/revoke",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `token=${refresh_token}&client_id=jet3kkqp4jnkm1v3ta7htu75g`,
      }
    );

    if (response.ok === true) {
      document.cookie =
        "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "id_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      window.location.href = "http://localhost:3000/";
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
      const tokenResponse = await fetch(
        "https://chatvious.auth.us-west-1.amazoncognito.com/oauth2/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `grant_type=refresh_token&client_id=jet3kkqp4jnkm1v3ta7htu75g&refresh_token=${refresh_token}`,
        }
      );
      const tokenData: TokenRefresh = await tokenResponse.json();

      // alert("Tokens Refreshed");
      setCookie("access_token", tokenData.access_token, tokenData.expires_in);
      setCookie("id_token", tokenData.id_token, tokenData.expires_in);
    } catch (error) {
      console.log(error);
    }
  }
  // }, tokenCheckerIntervalMinutes * 60000);
}, 10000);

export { signOut };
