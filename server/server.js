/* 

Book Search Engine
server.js
This script configures and instantiates and starts an Apollo Server with Graph QL. It applies Apollo server as Express middleware

*/

/* configure and instantiate Apollo Server with Graph QL and custom authMiddleware */
const { typeDefs, resolvers } = require('./schemas');
const { ApolloServer } = require('apollo-server-express');
const { authMiddleware } = require('./utils/auth');
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware
});

/* configure Express middleware */
const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

/* configure production to use static files */
const path = require('path');
if (process.env.NODE_ENV === 'production') app.use(express.static(path.join(__dirname, '../client/build')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../client/build/index.html')));

/* configure function to start Apollo server */
const PORT = process.env.PORT || 3001;
const db = require('./config/connection');
const startApolloServer = async (typeDefs, resolvers) => {
  await server.start();
  server.applyMiddleware({ app });
  db.once('open', () => {
    app.listen(PORT, () => {
      console.log(`GraphQL🔧 http://localhost:${PORT}${server.graphqlPath}`);
    });
  });
};

// call above function to start Apollo server
startApolloServer(typeDefs, resolvers);
