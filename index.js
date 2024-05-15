



const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const SSLCommerzPayment = require("sslcommerz-lts");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");



//MIADLEWERE


app.use(
  cors({
    origin: ["http://localhost:5173","https://etranslator.netlify.app"],
    credentials: true,
  })
);


app.use(express.json());
app.use(cookieParser());
app.use(cors())

//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}

//------------------------------------------------------------------
//------------------------------------------------------------------

const port = process.env.PORT || 5000;

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@robiul.13vbdvd.mongodb.net/?retryWrites=true&w=majority`;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@robiul.13vbdvd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false;

async function run() {
  try {
   
   
    const usersInfocollection = client.db("Canteen-Management").collection("usersInfo");
    const menucollection = client.db("Canteen-Management").collection("menu");
    const productCollection = client.db("Canteen-Management").collection("products");
    const cartscollection = client.db("Canteen-Management").collection("cart");
    const orderscollection = client.db("Canteen-Management").collection("order");

    const blogcollection = client.db("Canteen-Management").collection("blogs");
    const orderCollection = client.db("Canteen-Management").collection("payments");
    const feedbackCollection = client.db("Canteen-Management").collection("feedback");
    const tran_id = new ObjectId().toString();

    ////////////////////////////////////////////////////////////////////////////
    //                       jwt
    ///////////////////////////////////////////////////////////////////////////

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      res.send({ token })
    })
    ////////////////////////////////////////////////////////////////////////////
    //                      verifyAdmin 
    ////////////////////////////////////////////////////////////////////////////
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersInfocollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }

    ///////////////////////////////////////////////////////////////////////////
    //                         user data
    ///////////////////////////////////////////////////////////////////////////

    app.get('/users', async (req, res) => {
      const result = await usersInfocollection.find().toArray();
      res.send(result);
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user?.email }
      const existingUser = await usersInfocollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }

      const result = await usersInfocollection.insertOne(user);
      res.send(result);
    });

    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }

      const query = { email: email }
      const user = await usersInfocollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
    })

   ///////////////////////////////////////////////////////////////////////////
            //          user data
///////////////////////////////////////////////////////////////////////////




    
    //----------------------------------------------------------
    //               users info
    //-------------------------------------------------------

    app.post('/menu',async(req,res)=>{
      const data=req.body
      const result=await menucollection.insertOne(data)
      res.send(result)
    })
    
    app.get('/menu',async(req,res)=>{
      const result=await menucollection.find().toArray()
      res.send(result)
    })

    app.get("/menu/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await menucollection.findOne(filter);
      res.send(result);
    });


    app.post('/carts',async(req,res)=>{
      const body=req.body
      const result=await cartscollection.insertOne(body)
      res.send(result)
    })   
  //   app.get('/carts',async(req,res)=>{
  //     const result=await cartscollection.find().toArray()
  //     res.send(result) 
  // })
    app.get('/carts',async(req,res)=>{
      const email=req.query.email
      const query={email:email }
      const result=await cartscollection.find(query).toArray()
      res.send(result) 
  })

   //////////////////////////////////////////
   //            orders
   ///////////////////////////////////////////
   
  app.post('/orders',async(req,res)=>{
    const body=req.body
    const result=await orderscollection.insertOne(body)
    res.send(result)
  })  

    app.get('/orders',async(req,res)=>{
      const email=req.query.email
      const query={email:email }
      const result=await orderscollection.find(query).toArray()
      res.send(result) 
  })


  app.get('/allOrders',async(req,res)=>{
    const result=await orderscollection.find().toArray()
    res.send(result)
  })

  app.patch("/allOrders/:id", async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const updatedoc = {
      $set: {
        status: 'Approved'
      },
    };
    const result = await orderscollection.updateOne(filter, updatedoc);
    res.send(result);
  });

    ////////Blog//////
    app.post('/blogs',async(req,res)=>{
      const data=req.body
      const result=await blogcollection.insertOne(data)
      res.send(result)
    })

    app.get('/blogs',async(req,res)=>{
      const result=await blogcollection.find().toArray()
      res.send(result)
    })
    
    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await blogcollection.findOne(filter);
      res.send(result);
    });

    app.patch("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const body = req.body;
      const updatedoc = {
        $set: {
          title: body.title,
          description: body.description,
        },
      };
      const result = await blogcollection.updateOne(filter, updatedoc);
      res.send(result);
    });

    app.delete("/blogs/:id",async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await blogcollection.deleteOne(filter);
      res.send(result);
    });
    app.delete("/carts/:id",async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await cartscollection.deleteOne(filter);
      res.send(result);
    });



    /////////////////////////////////////////////////////////////////
    //                   sslcommerz integration
    /////////////////////////////////////////////////////////////////
    app.get('/payment', async (req, res) => {
      const result = await orderCollection.find().toArray()
      res.send(result)
    })


    app.post("/order/:id", async (req, res) => {
      console.log(req.body);
      const product = await productCollection.findOne({
        _id: new ObjectId(req.body.productId),
      });
      const order = req.body;
      const data = {
        total_amount: order.price,
        currency: "BDT",
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: `http://localhost:5000/payment/success/${tran_id}`,
        // replace with 'https://e-translator-server.vercel.app'
        fail_url: `http://localhost:5000/payment/fail/${tran_id}`,
        // replace with 'https://e-translator-server.vercel.app'
        cancel_url: "http://localhost:3030/cancel",
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: "Computer.",
        product_category: "Electronic",
        product_profile: "general",
        cus_name: order.name,
        cus_email: "customer@example.com",
        cus_add1: order.address,
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: order.postcode,
        cus_country: "Bangladesh",
        cus_phone: order.phonenumber,
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };
      console.log(data);
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL });
        const finalOrder = {
          product,
          paidStatus: false,
          tranjectionId: tran_id,
        };
        const result = orderCollection.insertOne(finalOrder);
        console.log("Redirecting to: ", GatewayPageURL);
      });
      const processedTransactions = new Set();

      app.post("/payment/success/:tranId", async (req, res) => {
        const tranId = req.params.tranId;

        if (processedTransactions.has(tranId)) {
          // Transaction already processed, handle accordingly 
          res.redirect(`http://localhost:5173/payment/success/${tranId}`);
          // replace with https://etranslator.netlify.app/
          return;
        }

        processedTransactions.add(tranId);

        const result = await orderCollection.updateOne(
          { tranjectionId: tranId },
          {
            $set: {
              paidStatus: true,
            },
          }
        );

        if (result.modifiedCount > 0) {
          res.redirect(
            `http://localhost:5173/payment/success/${req.params.tranId}`
            // replace with https://etranslator.netlify.app/
          );
        }
      });

      app.post("/payment/fail/:tranId", async (req, res) => {
        const result = await orderCollection.deleteOne(
          { tranjectionId: req.params.tranId },
          {
            $set: {
              paidStatus: true,
            },
          }
        );
        if (result.deletedCount) {
          res.redirect(
            `http://localhost:5173/payment/fail/${req.params.tranId}`
            // replace with https://etranslator.netlify.app/
          );
        }
      });
    });

      //////////////////////////////////////////
    //            user feedback
    ///////////////////////////////////////////

    //  user feedback Data
    app.post("/feedback", async (req, res) => {
      const feedbackComment = req.body;
      const result = await feedbackCollection.insertOne(feedbackComment);
      res.send(result);
    });

    app.get("/feedback", async (req, res) => {
      const cursor = feedbackCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/feedback/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await feedbackCollection.deleteOne(query);
      res.send(result);
    });
 


    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello translator");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});



