import { ApolloServer, gql } from 'apollo-server';
import { GraphQLRequestContext, BaseContext, GraphQLRequestListener, GraphQLRequestContextDidEncounterErrors } from 'apollo-server-plugin-base';
import Honeybadger from '@honeybadger-io/js';

Honeybadger.configure({
    apiKey: process.env.HONEYBADGER_API_KEY,
    environment: process.env.NODE_ENV || 'apollo-server'
});

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    title: String
    author: String
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    books: [Book]
  }
`;

const books = [
    {
        title: 'The Awakening',
        author: 'Kate Chopin',
    },
    {
        title: 'City of Glass',
        author: 'Paul Auster',
    },
];

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
        books: () => {
            // this should fail because it does not return the expected schema
            return 'test';
        },
    },
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: true,
    plugins: [
        {
            async requestDidStart(requestContext: GraphQLRequestContext<BaseContext>): Promise<GraphQLRequestListener<BaseContext> | void> {
                return {
                    async didEncounterErrors(requestContext: GraphQLRequestContextDidEncounterErrors<BaseContext>): Promise<void> {
                        if (requestContext.errors?.length) {
                            // here you should decide how you want to report the error details
                            Honeybadger.setContext({
                                errors: requestContext.errors
                            })
                            // depending where this server is hosted, you may be able to use notifyAsync or notify.
                            return Honeybadger.notifyAsync('GraphQL.didEncounterErrors.See.Context')
                        }

                    }
                }
            }
        }
    ]
});

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});
