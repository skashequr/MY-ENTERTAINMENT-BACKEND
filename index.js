const { MongoClient, ServerApiVersion , ObjectId} = require('mongodb');
const express = require("express");
var jwt = require('jsonwebtoken');

require("dotenv").config();
const stripe = require("stripe")(process.env.STRYPE_SECRET_KEY);
const app = express();

const port = process.env.PORT || 5000;

const cors = require("cors");
app.use(
  cors({
    origin: ["http://localhost:5173","https://employ-management-20d5c.web.app"],
    credentials: true,
  })
);

// app.use(cors)
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ruyf0su.mongodb.net/?retryWrites=true&w=majority`;

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
    const servicesItems = client
    .db("employeemanagement")
    .collection("services");
    const usersCollection = client
    .db("employeemanagement")
    .collection("usersCollection");
    const paymentCollection = client
    .db("employeemanagement")
    .collection("paymentCollection");
    const workSheedCollection = client
    .db("employeemanagement")
    .collection("workSheedCollection");
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SCRET, { expiresIn: '1h' });
      res.send({ token });
    });
    const verifyToken = (req, res, next) => {
      // console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }
     // use verify admin after verifyToken
     const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }
    app.post("/userInfo", async(req,res)=>{
      console.log(req.body);
      const data = req.body;
      const result = await usersCollection.insertOne(data);
      return res.send(result);
    });


    // userUpdate/admin
    app.patch("/userUpdateAdmin", async(req,res)=>{
      const { value , id} = req.query;

    console.log('Received value:', value , id);
      const filter = { _id : new ObjectId(id) }
      const updateDoc = {
        $set: { selectedRole: value},
      }
      const result = await usersCollection.updateOne(filter,updateDoc);
      res.send(result);
    });
    // This data show employ table
    app.get("/userInfo" , async(req,res)=>{
      const email = req.query.email;
      // console.log(email);
      const users = await usersCollection.find().toArray();
      return res.send(users)
    })
    // Log in users data
    app.get("/loginUser" , async(req,res)=>{
      const email = req.query.email;
      // console.log(email);
      const filter = { email : email }
      const users = await usersCollection.find(filter).toArray();
      return res.send(users)
    })

    //---------------- Payment Intent ------------
    app.post("/create-payment-intent", async (req, res) => {
      try {
        const { salary } = req.body;
        console.log(salary);
        const amount = parseInt(salary * 100);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          payment_method_types: ["card"],
        });
    
        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).send({ error: "Error creating payment intent" });
      }
    });

    
    app.post("/payment", async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);
      res.send(paymentResult);
    });
    
    app.get("/payment", async (req, res) => {
      const slug = req.query.slug;
      console.log(slug);
    
      const filter = { email : slug }
      const users = await paymentCollection.find(filter).toArray();
      return res.send(users)
    });
    app.get("/payments", async (req, res) => {
      const slug = req.query.slug;
      console.log(slug);
    
      const filter = { email : slug }
      const users = await paymentCollection.find(filter).toArray();
      return res.send(users)
    });
    



    app.post("/workSheet", async (req, res) => {
      const payment = req.body;
      const paymentResult = await workSheedCollection.insertOne(payment);
      res.send(paymentResult);
    });



    app.get("/workSheet", async (req, res) => {
      const filter = { email: req.query.email }; 
      console.log(filter);
    
      try {
        const paymentResult = await workSheedCollection.find(filter).toArray();
        res.send(paymentResult);
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
      }
    });

   app.get('/workSheetPagination', async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const filter = { email: req.query.email };
      console.log('pagination query worksheet pagination', page, size, filter);
      const result = await workSheedCollection.find(filter)
        // .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

app.get('/workSheetHrPagination', async (req, res) => {
  const page = parseInt(req.query.page);
  const size = parseInt(req.query.size);
  console.log('pagination query', page, size);
  const result = await workSheedCollection.find()
  .skip(page * size)
  .limit(size)
  .toArray();
  res.send(result);
  
})
    app.get("/workSheetCount", async (req, res) => {
      
      try {
        const count = await workSheedCollection.estimatedDocumentCount();
        // const count2 = await workSheedCollection.find().estimatedDocumentCount();
        res.send({count});
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
      }
    });








    app.patch("/usersInfo/admin/:id" , async(req,res)=>{
      const id = req.params.id
      console.log(id);
      const filter = { _id : new ObjectId(id) }
      const updateDoc = {
        $set: { veryfi: true},
      }
      const result = await usersCollection.updateOne(filter,updateDoc);
      console.log(result);
      res.send(result);
    })
    app.get("/services", async (req, res) => {
        try {
            const services = await servicesItems.find().toArray();
            return res.send(services);
          } catch (error) {
            res.status(500).send("Internal Server Error: " + error.message);
          }
      });
      app.get("/services-Details", async (req, res) => {
        try {
          const title = req.query.title;
          console.log(title);
  
          const filter = { title: title };
          const result = await servicesItems.findOne(filter)
          return res.send(result);
        } catch (error) {
            console.error("Error fetching service details:", error);
            res.status(500).send("Internal Server Error: " + error.message);
        }
    });
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Employee Management Services...");
  });
  
  app.listen(port, () => {
    console.log(`Employee Management Services is Running on port ${port}`);
  });
