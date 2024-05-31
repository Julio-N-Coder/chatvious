import React from "react";

export function SignUp({ className }: { className?: string }) {
  return (
    <a
      href="https://chatvious.auth.us-west-1.amazoncognito.com/signup?response_type=code&client_id=jet3kkqp4jnkm1v3ta7htu75g&redirect_uri=http://localhost:3000/callback"
      className={className}
    >
      Sign up
    </a>
  );
}

export function LogIn({ className }: { className?: string }) {
  return (
    <a
      href="https://chatvious.auth.us-west-1.amazoncognito.com/login?response_type=code&client_id=jet3kkqp4jnkm1v3ta7htu75g&redirect_uri=http://localhost:3000/callback"
      className={className}
    >
      Log in
    </a>
  );
}
