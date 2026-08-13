const fs = require('fs');

// 1. Update subscription-plans.tsx
let plansFile = '/media/callidus/callidus2/ses/Driver-Mobile-Assets/app/subscription-plans.tsx';
let plansContent = fs.readFileSync(plansFile, 'utf8');

// The file might contain id: 'plan_daily', price: 9, earningLimit: 500, etc.
// Let's replace '₹9' with '₹15'
plansContent = plansContent.replace(/₹9/g, '₹15');
plansContent = plansContent.replace(/price: 9/g, 'price: 15');
// Change earningLimit to 1000
plansContent = plansContent.replace(/earningLimit:\s*\d+/g, 'earningLimit: 1000');

fs.writeFileSync(plansFile, plansContent);

// 2. Update subscription-confirm.tsx
let confFile = '/media/callidus/callidus2/ses/Driver-Mobile-Assets/app/subscription-confirm.tsx';
let confContent = fs.readFileSync(confFile, 'utf8');
confContent = confContent.replace(/₹9/g, '₹15');
fs.writeFileSync(confFile, confContent);

// 3. Update tutorial-plans.tsx
let tutFile = '/media/callidus/callidus2/ses/Driver-Mobile-Assets/app/tutorial-plans.tsx';
let tutContent = fs.readFileSync(tutFile, 'utf8');
tutContent = tutContent.replace(/₹9/g, '₹15');
fs.writeFileSync(tutFile, tutContent);

console.log('Subscription plans updated');
