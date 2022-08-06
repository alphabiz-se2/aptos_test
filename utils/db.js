const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

let ensureConnectedCallback;
db.ensureConnected = new Promise(
  (resolve) => (ensureConnectedCallback = resolve)
);
db.$connect().then(ensureConnectedCallback, (err) => console.error(err));

module.exports = db;
