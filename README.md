# past

Next.js inspired opinionated framework focusing on the past

Assuming a folder of structure of:

```bash
pages
└── index.html
```

You can run this to serve it:

```bash
npx past
```

You can also specify which folder to run in as the first argument:

```bash
npx past example/directory/
```

## Nunjucks

```bash
pages
└── index.js
└── index.njk
```

```nunjucks
{# file:pages/index.njk #}
Hello, {{ name }}
```

```javascript
// file:pages/index.js
export default () => ({ name: "Nick" });
```

## Dynamic

```bash
pages
└── [id].js
```

```javascript
// file:pages/index.js
export default ({ params: id }) => `ID: ${id}`;
```

## Post

```bash
pages
└── index.js
```

```javascript
// file:pages/index.js
export const get = () =>
  `<form method="post"><button name="id" value="1234">Submit</button></form>`;
export const post = ({ body: id }) => `Form posted, id: ${id}`;
```

See [./examples](./examples) for full list of examples.
