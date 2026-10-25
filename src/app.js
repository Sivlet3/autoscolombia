const express = require('express');
const path = require('path');
const vehicleRoutes = require('./modules/vehicles/vehicle.routes');
const { notFound, errorHandler } = require('./middleware/error-handler');

const app = express();
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Autos Colombia' }));
app.use('/api/vehicles', vehicleRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
