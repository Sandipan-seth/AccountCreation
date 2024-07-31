const express = require('express');
const userModel = require("./usermodel");


const app = express();


app.use((req, res, next) => {
    console.log("Running")
    next();
})

app.get('/', (req, res) => {
    res.send('Hello, World!');
})


app.get("/create", async (req, res) => {
    let newUser = await userModel.create({
        name: "Sandipan Seth",
        email:"Sandipanseth@gmail.com",
        username: "sandipanseth"
    })

    res.send(newUser);
})

app.get("/read", async (req, res) =>{
    let users = await userModel.find();
    res.send(users);
})

app.get("/update",async (req,res) =>{
    let updatedUser = await userModel.findOneAndUpdate({username:"sandipanseth"},{name:"Sandipan Seth Updated version"},{new:true});
    res.send(updatedUser);
})

app.get("/delete", async (req, res) =>{
    let deletedUser = await userModel.findOneAndDelete({username:"sandipanseth"});
    res.send(deletedUser);
})




app.listen(3000)