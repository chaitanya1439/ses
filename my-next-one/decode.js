const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNDg0ODlhZC1jMGQ4LTQ5NzgtOWEwYi0xMzZkMGIyN2Q4ZjYiLCJpYXQiOjE3NjE5MTI4NDQsImV4cCI6MTc2MjUxNzY0NH0.US8Apz5qHuRkybCwdDT8XHTPBycLo66JHUIPEV6is1Y";
const payload = Buffer.from(token.split('.')[1], 'base64').toString('utf-8');
console.log(payload);
