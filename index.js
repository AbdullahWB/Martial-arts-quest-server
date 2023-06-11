const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000

// middleware
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.luk9jtm.mongodb.net/?retryWrites=true&w=majority`

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
})

async function run() {
    try {
        const usersCollection = client.db('MartialArtsQuest').collection('users')
        const instructorCollection = client.db('MartialArtsQuest').collection('instructors')
        const classesCollection = client.db('MartialArtsQuest').collection('classes')
        const studentsCollection = client.db('MartialArtsQuest').collection('addClasses')


        // user db in here

        // app.get('/users', async (req, res) => {
        //     const email = req.query.email
        //     if (!email) {
        //         res.send([])
        //     }
        //     const query = { email: email }
        //     const result = await usersCollection.find(query).toArray();
        //     res.send(result)
        // })

        app.put('/users/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            const query = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            }
            const result = await usersCollection.updateOne(query, updateDoc, options)
            console.log(result);
            res.send(result)
        })

        app.get('/users', async (req, res) => { 
            const result = await usersCollection.find().toArray();
            res.send(result);
        })

        // initiator db in here

        app.get('/instructors', async (req, res) => {
            const result = await instructorCollection.find().sort({ students: -1 }).toArray();
            res.send(result);
        })
        
        // classes db in here

        app.get('/classes', async (req, res) => {
            const result = await classesCollection.find().sort({ students: -1 }).toArray();
            res.send(result);
        })


        // add classes in db
        
        app.post('/classes', async (req, res) => { 
            const item = req.body;
            console.log(item);
            const result = await studentsCollection.insertOne(item);
            res.send(result);
        })
        

        // Send a ping to confirm a successful connection
        await client.db('admin').command({ ping: 1 })
        console.log(
            'Pinged your deployment. You successfully connected to MongoDB!'
        )
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('MartialArtsQuest Server is running..')
})

app.listen(port, () => {
    console.log(`MartialArtsQuest is running on port ${port}`)
})