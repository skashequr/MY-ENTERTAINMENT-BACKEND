const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000; 
// app.use(cors());
// Middleware 
app.use(cors()); 
app.use(express.json());


console.log(process.env.DB_USER)



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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const productCollection = client.db("myDB").collection("productsDB");
    const categoriesCollection = client.db("myDB").collection("categorieDB");

    app.use(express.json());

    app.post("/product", async (req, res) => {
      const newProduct = req.body;
      const result = await productCollection.insertOne(newProduct);
      res.send(result);
      console.log(newProduct);
    });

    app.get("/product",async (req,res)=>{
      const cursor = productCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post("/categorie", async (req, res) => {
      const newCategory = req.body;
      const result = await categoriesCollection.insertOne(newCategory);
      res.send(result);
      console.log(newCategory);
    });


    app.get("/categorie",async (req,res)=>{
      const cursor = categoriesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get("/:brandName", async (req, res) => {
      const brandName = req.params.brandName;
   
      const query = { brandName };
    
      try {
        const result = await productCollection.find(query).toArray();
    
        if (result.length === 0) {
          res.status(404).send("Category not found");
        } else {
          res.send(result);
        }
      } catch (error) {
        res.status(500).send("An error occurred: " + error.message);
      }
    });
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Assignment Ten Running');
});

app.listen(port, () => {
    console.log(`Assignment ten server is running on port ${port}`);
});