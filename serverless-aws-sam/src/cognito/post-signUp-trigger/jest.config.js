export default {
  testEnvironment: "node",
  transform: {
    "^.+\\.ts?$": "babel-jest",
  },
  transformIgnorePatterns: ["/node_modules/"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  testMatch: ["**/tests/*.test.ts"],
};
