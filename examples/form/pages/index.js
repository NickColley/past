export function get() {
  return { number: 1234 };
}

export function post({ body: { number } }) {
  return { number };
}
