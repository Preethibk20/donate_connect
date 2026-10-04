export const getWsUrl = (baseUrl: string): string => {
  return baseUrl.replace(/\/api\/?$/, '') + '/ws';
};
