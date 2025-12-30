import { getCookie } from "../utilities/cookies";
// import { TokenRefresh } from "../types";

async function signOut() {
  const domain = process.env.DOMAIN;

  document.cookie = `access_token=; Domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `refresh_token=; Domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

  const redirect_uri = process.env.SUB_DOMAIN_URL as string;
  window.location.href = redirect_uri;
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
      // tokens are automatically set as cookies by server
      const tokenResponse = await fetch(
        `${process.env.DOMAIN_URL}/auth/token_refresh`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token }),
        }
      );

      if (!tokenResponse.ok) {
        console.error("Failed to refresh tokens");
        return;
      }
      // const tokenData: TokenRefresh = await tokenResponse.json();
    } catch (error) {
      console.log(error);
    }
  }
}, tokenCheckerIntervalMinutes * 60000);

export { signOut };
