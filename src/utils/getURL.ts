export function getOriginUrl(): string {
  return process.env.NODE_ENVIRONMENT === "development"
    ? process.env.DEV_FRONTEND_URL || ''
    : process.env.PROD_FRONTEND_URL || '';
}