const CONVABOUT_PROD_API_URL = "https://api.convabout.com/api/v1/";
const CONVABOUT_DEV_API_URL = "http://127.0.0.1:8000/api/v1/";
// IMPORTANT: switch manually on production
const ENV = "development";
export const API_URL =
  ENV === "production" ? CONVABOUT_PROD_API_URL : CONVABOUT_DEV_API_URL;
