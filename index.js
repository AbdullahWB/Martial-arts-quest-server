const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken');
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


const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
    })
}


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

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })


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

        app.patch('/users/role/:id', async (req, res) => {
            const id = req.params.id;
            const role = req.query.role
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: role,
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        // admin role
        app.get('/users/role/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ admin: false, instructor: false, student: false });
            }

            const query = { email: email };
            const user = await usersCollection.findOne(query);

            if (!user) {
                res.send({ admin: false, instructor: false, student: false });
            }

            const role = user.role;
            const result = {
                admin: role === 'admin',
                instructor: role === 'instructor',
                student: role === 'student',
            };

            res.send(result);
        });
        

        // initiator db in here

        app.get('/instructors', async (req, res) => {
            const result = await instructorCollection.find().sort({ students: -1 }).toArray();
            res.send(result);
        })

        app.post("/classes", async (req, res) => {
            const body = req.body;
            if (!body) {
                return
            }
            const result = await classesCollection.insertOne(body);
            res.send(result)
        })

        app.get('/myClasses', async (req, res) => {
            const email = req.query.email
            if (!email) {
                res.send([])
            }
            const query = { instructorEmail: email }
            const result = await classesCollection.find(query).toArray();
            res.send(result)
        })

        // classes db in here

        app.get('/classes', async (req, res) => {
            const result = await classesCollection.find().sort({ students: -1 }).toArray();
            res.send(result);
        })


        // add classes in db

        app.post('/addClasses', async (req, res) => {
            const item = req.body;
            console.log(item);
            const result = await studentsCollection.insertOne(item);
            res.send(result);
        })

        app.get('/addClasses', verifyJWT, async (req, res) => {
            const email = req.query.email
            if (!email) {
                res.send([])
            }

            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'forbidden access' })
            }

            const query = { studentEmail: email }
            const result = await studentsCollection.find(query).toArray();
            res.send(result)
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