function isProduction() {
  return process.env.NODE_ENV === "production";
}

export { isProduction };
