require('dotenv').config({path: './Realtime-Server/.env'});
const { PrismaClient } = require('@prisma/client');
console.log(process.env.DATABASE_URL);
