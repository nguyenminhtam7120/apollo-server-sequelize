// #region custom color for terminal
const LCERROR = '\x1b[31m%s\x1b[0m'; //red
const LCINFO = '\x1b[36m%s\x1b[0m'; //cyan
const LCSUCCESS = '\x1b[32m%s\x1b[0m'; //green
// #endregion

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
    'graphpl', // your database
    'sa', // your username
    'admin123', // your password
    {
        host: 'TAM-BSP', // your localhost
        dialect: 'mssql', // your system database
    });
const { Op } = require("sequelize");

async function ConnectDB() {
    try {
        await sequelize.authenticate();
        console.log(LCSUCCESS, '=> Connection has been established successfully !!!');
    } catch (error) {
        console.error(LCERROR, '=> Unable to connect to the database: ', error);
    }
}

ConnectDB().then(() => {
    const db = {};
    db.Sequelize = Sequelize;
    db.sequelize = sequelize;

    // #region database models
    db.products = sequelize.define("products", {
        title: { type: Sequelize.STRING },
        description: { type: Sequelize.STRING },
        published: { type: Sequelize.BOOLEAN },
        price: { type: Sequelize.STRING }
    });
    db.users = sequelize.define("users", {
        name: { type: Sequelize.STRING },
    })
    // #endregion

    db.sequelize.sync();

    // #region apollo server
    const { ApolloServer } = require("@apollo/server");
    const { startStandaloneServer } = require("@apollo/server/standalone");
    const gql = require("graphql-tag");
    const typeDefs = gql`
    type Query {
        products: [Products],
        users: [Users]
    }
    type Products {
        title: String
        description: String
    }
    type Users {
        name: String
    }
    type Mutation {
        createProduct(product: CreateProductInput): Products
    }
    input CreateProductInput {
        title: String!
        description: String!,
        price: String!
    }
    `;
    const resolvers = {
        Query: {
            products: () => db.products.findAll({}),
            users: () => db.users.findAll({}),
        },
        Mutation: {
            createProduct: async (_, { product: { title, description, price } }) => {
                const newProduct = {
                    title,
                    description,
                    price
                };
                db.products.create(newProduct);
                return newProduct;
            },
        },

    };
    const server = new ApolloServer({ typeDefs, resolvers });
    startStandaloneServer(server, {
        listen: { port: 4000 },
    }).then(({ url }) => { console.log(LCINFO, `🚀 Server ready at ${url}`); })
        .catch(err => { console.log(LCERROR, '=> ' + err.message); });
    // #endregion

});