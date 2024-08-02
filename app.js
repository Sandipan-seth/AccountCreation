const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userModel = require("./models/user");
const postModel = require("./models/post");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


//middle ware

function isLoggedIn(req,res,next){
  if(req.cookies.token===""){
    res.send("Please login first");
  }
  else{
    let data = jwt.verify(req.cookies.token, "shhh");
    req.user = data;
  }
  next();
}

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/create", async (req, res) => {
  let { username, name, email, age, password } = req.body;
  let user = await userModel.findOne({ email });
  if (user) return res.status(300).send("User already exists");
  else {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        let newUser = await userModel.create({
          username,
          name,
          email,
          age,
          password: hash,
        });

        // console.log(newUser);

        let token = jwt.sign(
          { email: email, userId: newUser._id, username: newUser.username },
          "shhh"
        );
        res.cookie("token", token);
        // console.log(token);
        // res.send("registered successfully");
        res.redirect("/");
      });
    });
  }
});

app.get("/login", async (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  let{email,password}=req.body;
  let user = await userModel.findOne({ email });
  if(!user) return res.status(400).send("User not found");
  else{
    bcrypt.compare(password,user.password,(err,result)=>{
        // console.log(result);
        if(result){
            // console.log(user.username)
            let token = jwt.sign({email:email, userId:user._id,username:user.username},"shhh");
            res.cookie("token",token);
            res.send("you can login");
        }
        else{
            res.redirect("/login");
        }
    })
  }
});


app.get("/profile",isLoggedIn, (req,res)=>{
  res.send(`Welcome ${req.user.username}`);
  // console.log(req.user);
})


app.get("/logout", (req, res) => {
  res.cookie("token","");
  res.redirect("/login");
});


app.listen(3000);
