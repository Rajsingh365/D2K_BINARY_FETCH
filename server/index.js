import express from 'express'
import dotenv from 'dotenv'
import paymentRoutes from './routes/payment.route.js'
import cors from 'cors'

dotenv.config()

const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.get('/', (req, res) => {
  res.send("Hello")
});

app.use('/api/payment', paymentRoutes)

app.listen(process.env.PORT, () => {
  console.log('Node BK Working on localhost:5000');
});