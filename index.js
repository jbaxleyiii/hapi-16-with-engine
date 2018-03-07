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

const start = async () => {
  const engine = new ApolloEngine({
    apiKey: process.env.ENGINE_API_KEY,
  });
  const listener = await engine.hapiListener({ port: PORT });
  const server = new hapi.Server({
    debug: { request: "*" },
  });

  server.connection({ host, listener, autoListen: false });

  server.register({
    register: graphqlHapi,
    options: {
      path: "/graphql",
      graphqlOptions: { schema, tracing: true, cacheControl: true },
      route: { cors: true },
    },
  });

  server.start(err => {
    if (err) throw err;
    const { protocol, host } = server.info;
    console.log(
      `Server running at: ${protocol}//${host}:${PORT} with Engine in front!`
    );
  });
};
start();
