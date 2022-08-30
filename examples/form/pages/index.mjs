export const get = () => `
<form method="post">
  <label for="name">What is your name?</label>
  </br>
  <input id="name" name="name"/>
  </br>
  </br>
  <button>Submit</button>
</form>
`;
export const post = ({ body: { name } }) => `
<h1>Hello ${name || "mate"}!</h1>
<a href="/">Back</a>
`;
