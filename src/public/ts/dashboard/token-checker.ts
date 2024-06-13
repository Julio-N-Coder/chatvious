import { setCookie } from "../utilities/cookies";

// http://localhost:3000/dashboard?access_token=randomToken&id_token=randomIDToken&refresh_token=randomRefreshToken&token_type=Bearer&expires_in=randomExperation`
function tokenChecker() {
  const urlParams = new URLSearchParams(window.location.search);

  if (
    urlParams.get("refresh_token") ||
    (urlParams.get("id_token") && urlParams.get("access_token"))
  ) {
    const access_token = urlParams.get("access_token");
    const id_token = urlParams.get("id_token");
    const refresh_token = urlParams.get("refresh_token");

    if (typeof refresh_token === "string") {
      localStorage.setItem("refresh_token", refresh_token);
    }

    if (typeof id_token === "string" && typeof access_token === "string") {
      localStorage.setItem("id_token", id_token);
      localStorage.setItem("access_token", access_token);

      // decode access token
      const decoded = atob(access_token.split(".")[1]);
      const access_token_data = JSON.parse(decoded);
      const expiration = access_token_data.exp;
      const issuedAt = access_token_data.iat;

      // turn seconds into days (unix format to days)
      const expiresIn = (expiration - issuedAt) / 86400;

      setCookie("access_token", access_token, expiresIn);
    }

    // Changes url to not have giant tokens in url
    history.replaceState({}, "", "http://localhost:3000/dashboard");
  }
}

// handle sign out error to show ui a problem.
async function signOut() {
  const refresh_token = localStorage.getItem("refresh_token");

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
      localStorage.removeItem("access_token");
      localStorage.removeItem("id_token");
      localStorage.removeItem("refresh_token");
      document.cookie =
        "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      window.location.href = "http://localhost:3000/";
    }
  } catch (error) {
    // handle error and display it to ui
    console.log(error);
  }
}

export { tokenChecker, signOut };
