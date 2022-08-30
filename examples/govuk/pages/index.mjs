export const get = () => {
  return { heading: "Sign in" };
};
export const post = ({ body: { email, password } }) => {
  let errorSummary = [];
  let errors = {};
  if (!email) {
    errors.email = {
      text: "Enter email",
    };
    errorSummary.push({
      href: "#email",
      text: "Enter email",
    });
  }
  if (!password) {
    errors.password = {
      text: "Enter password",
    };
    errorSummary.push({
      href: "#password",
      text: "Enter password",
    });
  }
  return { errors, errorSummary, email };
};
