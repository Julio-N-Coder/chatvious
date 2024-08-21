import React from "react";

const client_id = process.env.USER_POOL_CLIENT_ID;
const cognito_domain_url = process.env.COGNITO_DOMAIN_URL;

export function SignUp({ className }: { className?: string }) {
  const callbackUrl = process.env.IS_DEV_SERVER
    ? "http://localhost:3000/callback"
    : "https://chatvious.coding-wielder.com/main/callback";
  return (
    <a
      href={`${cognito_domain_url}/signup?response_type=code&client_id=${client_id}&redirect_uri=${callbackUrl}`}
      className={className}
    >
      Sign up
    </a>
  );
}

export function LogIn({ className }: { className?: string }) {
  const callbackUrl = process.env.IS_DEV_SERVER
    ? "http://localhost:3000/callback"
    : "https://chatvious.coding-wielder.com/main/callback";
  return (
    <a
      href={`${cognito_domain_url}/login?response_type=code&client_id=${client_id}&redirect_uri=${callbackUrl}`}
      className={className}
    >
      Log in
    </a>
  );
}
