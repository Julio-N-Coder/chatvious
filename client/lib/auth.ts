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

function checkAuthStatus(
  setIsLoggedIn: (value: React.SetStateAction<boolean>) => void
) {
  let CookieName = "access_token=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let cookieArray = decodedCookie.split(";");
  for (let i = 0; i < cookieArray.length; i++) {
    let c = cookieArray[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (
      c.indexOf(CookieName) == 0 &&
      c.substring(CookieName.length, c.length)
    ) {
      setIsLoggedIn(true);
    }
  }
}

export { signOut, checkAuthStatus };
