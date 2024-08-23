const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cabinetsRouter = require('./routes/cabinets');
const saveSelectionsRouter = require('./routes/saveSelections');

const app = express();

mongoose.connect('mongodb://localhost/kitchenCatalog', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(express.json());
app.use('/api/cabinets', cabinetsRouter);
app.use('/api', saveSelectionsRouter);

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});