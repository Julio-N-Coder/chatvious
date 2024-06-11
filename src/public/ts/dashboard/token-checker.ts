// http://localhost:3000/dashboard?access_token=randomToken&id_token=randomIDToken&refresh_token=randomRefreshToken&token_type=Bearer&expires_in=randomExperation`
export default function tokenChecker() {
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
    console.log("history cleared");
  }
}
