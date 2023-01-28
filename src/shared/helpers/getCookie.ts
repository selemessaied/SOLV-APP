export const getCookie = (cookie: string) => {
  return document.cookie
    .split("; ")
    .filter((row) => row.startsWith(`${cookie}=`))
    .map((c) => c.split("=")[1])[0];
};
