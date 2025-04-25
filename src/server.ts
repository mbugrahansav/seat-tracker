import express from 'express';
import router from './routes/router';
const app = express();
const port = 3000;

app.use(express.json());

app.use('/dom-father', router);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});