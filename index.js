const express = require('express')
const cors = require('cors');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());


const port = process.env.PORT || 5000;


app.get('/', (req, res) =>{
    res.send("JOB PORTAL server is running !")
})
app.listen(port, ()=>{
    console.log(`server is running on port : ${port}`)
})

