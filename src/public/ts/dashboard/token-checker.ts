// http://localhost:3000/dashboard?access_token=randomToken&id_token=randomIDToken&refresh_token=randomRefreshToken&token_type=Bearer&expires_in=randomExperation`
function tokenChecker() {
  const urlParams = new URLSearchParams(window.location.search);

  if (
    urlParams.get("access_token") ||
    (urlParams.get("id_token") && urlParams.get("refresh_token"))
  ) {
    const access_token = urlParams.get("access_token");
    const id_token = urlParams.get("id_token");
    const refresh_token = urlParams.get("refresh_token");

    if (typeof access_token === "string") {
      localStorage.setItem("access_token", access_token);
    }

    if (typeof id_token === "string" && typeof refresh_token === "string") {
      localStorage.setItem("id_token", id_token);
      localStorage.setItem("refresh_token", refresh_token);
    }

    // Changes url to not have giant tokens in url
    history.replaceState({}, "", "http://localhost:3000/dashboard");
  }
}

// handle sign out error to show ui a problem.
async function signOut() {
  const refresh_token = localStorage.getItem("refresh_token");
  // console.log(refresh_token);

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

    // handle error and display it to ui
    if (response.ok === false) {
      console.log("failed to send");
    }
    if (response.ok === true) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("id_token");
      localStorage.removeItem("refresh_token");

      window.location.href = "http://localhost:3000/";
    }
  } catch (error) {
    console.log(error);
  }
}

export { tokenChecker, signOut };
