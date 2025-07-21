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

dotenv.config({ path: path.resolve('../.env') }); // gerekirse './.env' de olabilir

const app = express();
const port = process.env.PORT || 3002; 

app.use(cors()); // CORS middleware'ini kullanın
app.use(express.json()); // JSON parselleme

methods(app); // API metotlarını ekleyin
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
