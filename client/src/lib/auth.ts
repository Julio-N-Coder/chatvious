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

function signOut() {
  const domain = process.env.DOMAIN;

  document.cookie = `access_token=; Domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `refresh_token=; Domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

  const redirect_uri = process.env.SUB_DOMAIN_URL as string;

  window.location.href = redirect_uri;
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
