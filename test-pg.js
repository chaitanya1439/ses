const { parse } = require('pg-connection-string');
const str = "postgresql://postgres:RidegoPassword123!@ridego-db.cmbwkyg28hi2.us-east-1.rds.amazonaws.com:5432/postgres\"REDIS_URL=redis://localhost:6379";
console.log(parse(str));
