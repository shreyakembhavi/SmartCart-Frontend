const appJson = require("./app.json");

module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    API_URL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000",
  },
});
