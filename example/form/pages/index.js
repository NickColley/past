export const get = () => {
  return { number: 1234 };
};
export const post = ({ body: { number } }) => {
  return { number };
};
