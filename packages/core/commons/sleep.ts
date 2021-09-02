/* async sleep function, sleep for x ms */
export const sleep = async (ms?: number) => new Promise((resolve) => setTimeout(resolve, ms));
