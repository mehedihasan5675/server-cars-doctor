const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const express=require('express')
const jwt=require('jsonwebtoken')
const app=express()
const cors=require('cors')
const port=process.env.PORT || 5000

app.use(cors())
app.use(express.json())

console.log(process.env.DB_USER);

app.get('/',(req,res)=>{
    res.send('server is running')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ruywwtc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const verifyJWT=(req,res,next)=>{
  const authorization=req.headers.authorization 
  if(!authorization){
    return res.status(401).send({error:true,message:'unauthorized token'})
  }
  const token=authorization.split(' ')[1]
jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
  if(err){
    return res.status(403).send({error:true,message:'uncaught access'})
  }
  req.decoded=decoded
  next()
})  
}
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("Car-Doctor-DB");
    const servicesCollection = database.collection("services");
    const bookingCollection = database.collection("booking");

//=======================//


//jwt token
app.post('/jwt',(req,res)=>{
  const user=req.body 
  const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn: '1h' })
  res.send({token})
})
//get service data with productive api or url from database
app.get('/services',async(req,res)=>{
    const query={}
    const cursor= servicesCollection.find(query)
    const result=await cursor.toArray()
    res.send(result)
})
app.get('/services/:id',async(req,res)=>{
    const ID=req.params.id
    console.log(ID);
    
    const query={_id:new ObjectId(ID)}
    const result= await servicesCollection.findOne(query)
    res.send(result)
})
//booking data get
app.get('/booked-service',verifyJWT,async(req,res)=>{
  const Email=req.query.email
  const decoded=req.decoded
  const tokenEmail=decoded.email
  if(Email !== tokenEmail){
    return res.status(403).send({error:true,message:'forbidden access'})
  }
  console.log(Email);
  let query={}
  if(Email){
    query={email:Email}
  }
  const cursor=bookingCollection.find(query)
  const result=await cursor.toArray()
  res.send(result)
})

app.post('/services/booking',async(req,res)=>{
  const bookingData=req.body 
  console.log(bookingData);
  const result=await bookingCollection.insertOne(bookingData)
  res.send(result)

  
})

  //delete
app.delete('/booked-service/:id',async(req,res)=>{
  const Id=req.params.id 
  console.log(Id);
  const query={_id: new ObjectId(Id)}
  const result=await bookingCollection.deleteOne(query)
  res.send(result)
  
})

//update
app.patch('/booked-service/:id',async(req,res)=>{
  const Id=req.params.id 
  const updateData=req.body 
  const filter={_id:new ObjectId(Id)}
  const toUpdate={
    $set:{
      status:updateData.status
    }
  }
  const result=await bookingCollection.updateOne(filter,toUpdate)
res.send(result)
  
  
})
//=======================//


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port,()=>{
    console.log(`server is running with ${port} this port`);
    
})

module.exports = app