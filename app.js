const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");

const userModel = require("./models/user");
const postModel = require("./models/post");
const multerConfig = require("./config/multerconfig");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


//middle ware

function isLoggedIn(req,res,next){
  if(req.cookies.token==="" || req.cookies.token === undefined){
    res.redirect("/login");
  }
  else{
    let data = jwt.verify(req.cookies.token, "shhh"); 
    req.user = data;
    next();
  }
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
        res.redirect("/profile");
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
  if(!user) {
    res.redirect("/");
  }
  else{
    bcrypt.compare(password,user.password,(err,result)=>{
        // console.log(result);
        if(result){
            // console.log(user.username)
            let token = jwt.sign({email:email, userId:user._id,username:user.username},"shhh");
            res.cookie("token",token);
            res.redirect("/profile");
        }
        else{
            res.redirect("/login");
        }
    })
  }
});



app.get("/profile",isLoggedIn, async (req,res)=>{
  let user = await userModel.findOne({ email: req.user.email }).populate("posts");
  res.render("profile",{user});
})

app.post("/post", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });

  let post = await postModel.create({
    user: user._id,
    content: req.body.content
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});


app.get("/like/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({_id: req.params.id}).populate("user");
  // console.log(req.user.userId);

  if(post.likes.indexOf(req.user.userId) === -1){
    post.likes.push(req.user.userId);
  }
  else{
    post.likes.splice(post.likes.indexOf(req.user.userId),1); 
  }
  // console.log(post); 
  await post.save();
  res.redirect("/profile");
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");

  res.render("edit",{post});
});

app.post("/update/:id", isLoggedIn, async (req, res) => {
  let {oldedit,newedit} =req.body;
  let post = await postModel.findOneAndUpdate({_id:req.params.id},{content:newedit})
  res.redirect("/profile");
})


app.get("/delete/:id", isLoggedIn, async (req, res) => {
  await postModel.findOneAndDelete({_id:req.params.id});
  res.redirect("/profile");
});

app.get("/logout", (req, res) => {
  res.cookie("token","");
  res.redirect("/login");
});



app.listen(3000);
