import express from 'express';
import cors from 'cors';
import methods from './methods/index.js'; // API metotlarınızı içeren dosya
import methodsanimals from './methods/animals.js';
import methodsoffices from './methods/offices.js';
import methodpersonal from './methods/personal.js';
import methodsclinic from './methods/clinic.js';
import MethodPersoneSearch from './methods/personal-control.js';
import methodappointment from './methods/appointment.js';
import methodProcess from './methods/process.js';
import methodPatProcess from './methods/pat-process.js';
import methodPayment from './methods/payments.js';
import methodStockMovements from './methods/stock-movments.js';
import methodVaccine from './methods/vaccine.js';
import dotenv from 'dotenv';
import path from 'path';
import bodyParser from 'body-parser';
import './services/mailReminder.js';

dotenv.config({ path: path.resolve('../.env') }); // gerekirse './.env' de olabilir

const app = express();
const port = process.env.MYSQLPORT;

app.use(cors({ origin: "*"}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// JSON ve URL-encoded veri ayrıştırma middleware'leri
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

methods(app); 
methodsanimals(app);
methodsoffices(app);
methodpersonal(app);
methodsclinic(app);
MethodPersoneSearch(app);
methodappointment(app);
methodProcess(app);
methodPatProcess(app);
methodPayment(app);
methodStockMovements(app);
methodVaccine(app);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
