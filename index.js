const express = require('express')
const cors = require('cors');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');



//middleware
app.use(cors());
app.use(express.json());


const port = process.env.PORT || 5000;
const jobs = require('./jobs.json');

app.get('/', (req, res) =>{
    res.send("JOB PORTAL server is running !")
})




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.95qfhdq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const jobsCollection = client.db('jobsDB').collection('jobs');
    const jobApplicationCollection = client.db('jobsDB').collection('jobApplication');

    await jobsCollection.deleteMany({});
    await jobsCollection.insertMany(jobs);



    app.get('/jobs', async (req, res) =>{
        const allJobs = await jobsCollection.find().toArray();
        res.send(allJobs);
    })
    app.get('/jobs/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await jobsCollection.findOne(query);
        res.send(result);
    })

    app.get('/job-application', async (req, res) => {
        const email = req.query.email;
        const query = { applicant_email: email }
        const result = await jobApplicationCollection.find(query).toArray();

        // fokira way to aggregate data
        for (const application of result) {
            console.log(application.job_id)
            const query1 = { _id: new ObjectId(application.job_id) }
            const job = await jobsCollection.findOne(query1);
            if(job){
                application.title = job.title;
                application.location = job.location;
                application.company = job.company;
                application.company_logo = job.company_logo;
            }
        }
        res.send(result)

    })

    app.post('/job-applications', async (req, res) => {
        const application = req.body;
        const result = await jobApplicationCollection.insertOne(application);
        res.send(result);
    })

    
    app.post('/jobs', async(req, res) =>{
        const newJob = req.body;
        const result = await jobsCollection.insertOne(newJob);
        res.send(result);
    })

    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, ()=>{
    console.log(`server is running on port : ${port}`)
})

