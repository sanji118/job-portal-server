const express = require('express')
const cors = require('cors');
const jwt = require("jsonwebtoken")
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


    //jobs related APIs
    const jobsCollection = client.db('jobsDB').collection('jobs');
    const jobApplicationCollection = client.db('jobsDB').collection('jobApplication');

    await jobsCollection.deleteMany({});
    await jobsCollection.insertMany(jobs);




    //auth related APIs
    app.post('/jwt', async(req, res)=>{
        const user = req.body;
        const token = jwt.sign(user, 'secret', {expiresIn: '1h'});
        res.send(token);
    })

//jobs related APIs
    app.get('/jobs', async (req, res) => {
        const email = req.query.email;
        let query = {};
        if (email) {
            query = { hr_email: email }
        }
        const cursor = jobsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
    });

    app.get('/jobs/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await jobsCollection.findOne(query);
        res.send(result);
    });
    app.post('/jobs', async (req, res) => {
        const newJob = req.body;
        const result = await jobsCollection.insertOne(newJob);
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



    // app.get('/job-applications/:id') ==> get a specific job application by id

    app.get('/job-applications/jobs/:job_id', async (req, res) => {
        const jobId = req.params.job_id;
        const query = { job_id: jobId }
        const result = await jobApplicationCollection.find(query).toArray();
        res.send(result);
    })



    app.post('/job-applications', async (req, res) => {
        const application = req.body;
        const result = await jobApplicationCollection.insertOne(application);
        res.send(result);
    })


    app.post('/job-applications', async (req, res) => {
        const application = req.body;
        const result = await jobApplicationCollection.insertOne(application);

        // Not the best way (use aggregate) 
        // skip --> it
        const id = application.job_id;
        const query = { _id: new ObjectId(id) }
        const job = await jobsCollection.findOne(query);
        let newCount = 0;
        if (job.applicationCount) {
            newCount = job.applicationCount + 1;
        }
        else {
            newCount = 1;
        }

        // now update the job info
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
            $set: {
                applicationCount: newCount
            }
        }

        const updateResult = await jobsCollection.updateOne(filter, updatedDoc);

        res.send(result);
    });


    app.patch('/job-applications/:id', async (req, res) => {
        const id = req.params.id;
        const data = req.body;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
            $set: {
                status: data.status
            }
        }
        const result = await jobApplicationCollection.updateOne(filter, updatedDoc);
        res.send(result)
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

