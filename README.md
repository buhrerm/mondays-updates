For a given board in a Mondays.com workspace, you can use this to fetch your updates and template them in html for your business website.

- The frontend/infiniteScroll.html file is the html code you can copy into your website.
- The lambda/index.mjs file is the js code you can run on cloud infrastructure (lambda), or run on another server.

.env file:

```
MONDAY_API_KEY=<apiKey>
```

To deploy on lambda, zip the index.mjs file, package.json, and node_modeuls folder and upload to lambda
