# 🌐 past

Web framework for people from the past.

[![past latest npm version](https://img.shields.io/npm/v/past.svg)](https://www.npmjs.com/package/past)

> **⚠️✋ Do not use in production: this project is new and may have security and performance issues.**

## Creating a page

Create a `index.html` HTML file inside a 'pages' folder.

```bash
mkdir pages
echo '<h1>Hello, World</h1>' > pages/index.html
```

Then run `npx past`.

You will see your page at the URL [http://localhost:3000](http://localhost:3000).

## Examples

Use these examples to start or learn from:

- [Form](./examples/form/) &ndash; simple form with user input that shows a message.
- [Nunjucks](./examples/nunjucks/) &ndash; simple Nunjucks page with data.
- [GOV.UK](./examples/govuk/) &ndash; GOV.UK login form with error messages.
