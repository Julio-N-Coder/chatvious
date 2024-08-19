function getCookie(cookieName: string) {
  let name = cookieName + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let cookieArray = decodedCookie.split(";");
  for (let i = 0; i < cookieArray.length; i++) {
    let c = cookieArray[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

const client_id = process.env.USER_POOL_CLIENT_ID;
const cognito_domain_url = process.env.COGNITO_DOMAIN_URL;

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

      const redirect_uri = process.env.IS_DEV_SERVER
        ? "http://localhost:8040/"
        : (process.env.SUB_DOMAIN_URL as string);

      window.location.href = redirect_uri;
    }
  } catch (error) {
    // handle error and display it to ui
    console.log(error);
  }
}

function checkAuthStatus(
  setIsLoggedIn: (value: React.SetStateAction<boolean>) => void
) {
  let accessCookie = "access_token=";
  let refreshCookie = "refresh_token=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let cookieArray = decodedCookie.split(";");
  for (let i = 0; i < cookieArray.length; i++) {
    let c = cookieArray[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (
      c.indexOf(accessCookie) == 0 &&
      c.substring(accessCookie.length, c.length)
    ) {
      setIsLoggedIn(true);
    } else if (
      c.indexOf(refreshCookie) == 0 &&
      c.substring(refreshCookie.length, c.length)
    ) {
      setIsLoggedIn(true);
    }
  }
}

export { signOut, checkAuthStatus, getCookie };
