const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const customersRoutes = require('./routes/customer.route');
const pointsRoutes = require('./routes/points.route');
const walletRoutes = require('./routes/wallet.routes');
const { PORT, TIMEZONE, API_KEY, DAILY_CAP, EARN_RATE, ERRORS } = require('./config/constants');

const app = express();
app.use(express.json());


app.use('/customers', customersRoutes);
app.use('/', pointsRoutes); 
app.use('/wallet', walletRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    timezone: TIMEZONE 
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    error: ERRORS.NOT_FOUND, 
    message: 'Endpoint not found' 
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: ERRORS.INTERNAL_ERROR, 
    message: 'An internal error occurred' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Loyalty Lite API running on port ${PORT}`);
  console.log(`📍 Timezone: ${TIMEZONE}`);
  console.log(`🔑 API Key: ${API_KEY}`);
  console.log(`📊 Daily cap: ${DAILY_CAP} points`);
});

