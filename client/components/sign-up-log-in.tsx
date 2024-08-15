import React from "react";

export function SignUp({ className }: { className?: string }) {
  const callbackUrl = process.env.IS_LOCAL_SERVER
    ? "http://localhost:3000/callback"
    : "https://chatvious.coding-wielder.com/main/callback";
  return (
    <a
      href={`https://chatvious.auth.us-west-1.amazoncognito.com/signup?response_type=code&client_id=jet3kkqp4jnkm1v3ta7htu75g&redirect_uri=${callbackUrl}`}
      className={className}
    >
      Sign up
    </a>
  );
}

export function LogIn({ className }: { className?: string }) {
  const callbackUrl = process.env.IS_LOCAL_SERVER
    ? "http://localhost:3000/callback"
    : "https://chatvious.coding-wielder.com/main/callback";
  return (
    <a
      href={`https://chatvious.auth.us-west-1.amazoncognito.com/login?response_type=code&client_id=jet3kkqp4jnkm1v3ta7htu75g&redirect_uri=${callbackUrl}`}
      className={className}
    >
      Log in
    </a>
  );
}
