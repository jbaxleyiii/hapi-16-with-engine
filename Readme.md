## Hapi 16 + Engine

The new Engine API works great with both Hapi 17 (in the official docs) and Hapi 16. This repo is a quick demo of getting engine up and running with Hapi 16.

In a copy paste form, here is the contents of `index.js` that you can run directly!

```js
const hapi = require("hapi");
const { graphqlHapi } = require("apollo-server-hapi");
const { makeExecutableSchema } = require("graphql-tools");
const { ApolloEngine } = require("apollo-engine");

const host = "localhost";
const PORT = 3000;

const schema = makeExecutableSchema({
  typeDefs: `type Query { hello: String @cacheControl(maxAge: 240) }`,
  resolvers: { Query: { hello: () => "world" } },
});

// needs to be async for the proxy to start up
const start = async () => {

  // configure Engine (this is where you would add in thing like cache config)
  const engine = new ApolloEngine({
    apiKey: process.env.ENGINE_API_KEY,
  });

  // connect to the engine proxy
  const listener = await engine.hapiListener({ port: PORT });

  // create a hapi server
  const server = new hapi.Server();

  // setup engine to the be listener for the hapi app!
  server.connection({ host, listener, autoListen: false });

  // setup graphql endpoint
  server.register({
    register: graphqlHapi,
    options: {
      path: "/graphql",
      // turn on cacheControl support and tracing
      graphqlOptions: { schema, tracing: true, cacheControl: true },
      route: { cors: true },
    },
  });

  // start the server!
  server.start(err => {
    if (err) throw err;
    const { protocol, host } = server.info;
    console.log(
      `Server running at: ${protocol}//${host}:${PORT} with Engine in front!`
    );
  });
};

// run the above function
start();
```

### Load testing
To run a load test to get information about Engine timing, do the following steps:

1. `npm start`
2. `npm run load:with-engine`
3. `npm run load:with-hapi -- -t http://localhost:<port>` where `<port>` is replaced with the port hapi is on from step 1


This will generate two files (`engine.json`, and `hapi.json`) with timing data included for comparision
