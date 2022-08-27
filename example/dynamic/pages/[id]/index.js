export default ({ params: { id } }) => {
  return `Id: ${id}<form method="post"><button name="test" value="hello">submit</button></form>`;
};
