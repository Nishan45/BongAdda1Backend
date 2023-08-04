const mongoToConnect=require('./db')
mongoToConnect()

const express = require('express')
const app = express()
const port = 3000
const Cors=require('cors')
const User = require('./User');

const { body, validationResult } = require('express-validator');

const  PostImage  = require('./PostImg')
const Other=require('./Other')



app.use(Cors())
app.use(express.json());


app.post('/',[
  body('name','enter a valid name').isLength({min:2}),
  body('email','enter a valid email').isEmail(),
  body('password','password must be atleast 5 characters').isLength({min:5}),
],async (req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
      res.json({errors:errors.array});
    }
    else{
      
      const exist=await User.findOne({email:req.body.email})
      if(exist){
        res.json('exist')
      }
      else{
      User.create({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        followers:[],
        following:[],
        isfollowing:{}

      }).then(user=>res.json(user))
    .catch(e=>console.log(e))  
      }
    } 
})

app.post('/login',async(req,res)=>{

  const{email,password}=req.body;
  const data=await User.findOne({email:email,password:password})
  const id=await User.findOne({email:email})
  
  if(data){
    res.json(data)
  }
  else if(id){
    res.json('mismatched')
  }
  else{
    res.json('notexist')
  }
}
)


app.post('/upload_img',async(req,res)=>{
     
  const data=req.body;
  
  
  const user=await User.findOne({email:data.email});
  
  const result =await User.updateOne({_id:user},{
    
    $set:data.image
  })
})


app.post('/upload_postImg',async(req,res)=>{
  const errors=validationResult(req);
  if(!errors.isEmpty()){
    res.json({errors:errors.array});
  }
  else{
  const {email,image,discription}=req.body;
  const user=await User.findOne({email:email});

  PostImage.create({
   
    user_id:email,
    image,
    discription,
    name:user.name,
    profImg:user.profImg,
    likes:{},
    comments:[]
  }).then(PostImg=>res.json(PostImg))
  .catch(e=>console.log(e))
}
})

app.post('/upload_other',async(req,res)=>{

  const errors=validationResult(req);
  if(!errors.isEmpty()){
    res.json({errors:errors.array});
  }
  else{
  const {email,selected,title,body,author}=req.body;
  const user=await User.findOne({email:email});

  Other.create({
    user_id:email,
    category:selected,
    title,
    body,
    author:author,
    profImg:user.profImg,
    name:user.name,
    likes:{},
    comments:[]
  }).then(other=>res.json(other))
  .catch(e=>console.log(e))
}
})

app.post('/get_posts',async (req,res)=>{
  const Data=await PostImage.find({}).sort({ _id: -1 })
  res.json(Data);
  
})
app.post('/get_user_images',async (req,res)=>{
  const email=req.body.email
  const Data=await PostImage.find({user_id:email}).sort({ _id: -1 })
  res.json(Data);

})
app.post('/get_stories',async (req,res)=>{
  const category=req.body.category;
  const Data=await Other.find({category:category}).sort({ _id: -1 })
  res.json(Data);
  
})
app.post('/get_user_stories',async (req,res)=>{
  const {category,email}=req.body;
  const Data=await Other.find({category:category,user_id:email}).sort({ _id: -1 })
  res.json(Data);
  
})
app.post('/like',async (req,res)=>{
  const{email,postid,checking}=req.body;
  const post=await PostImage.findById(postid);
  let id='';
  for(let i=0;i<email.length;i++){
    if(email[i]=='.'){
      break;
    }
    id+=email[i];
  }
  const isliked=post.likes.get(id)
  if(checking){
    if(isliked){
      res.json({yes:true,number:post.likes.size})
    }
    else{
      res.json({yes:false,number:post.likes.size})
    }
  }
  else{
  if(isliked){
    post.likes.delete(id)
    res.json({yes:false,number:post.likes.size})
  }
  else{
    post.likes.set(id,true);
    res.json({yes:true,number:post.likes.size})
  }
  post.save()
}
})
app.post('/other_like',async (req,res)=>{
  const{email,postid,checking}=req.body;
  const post=await Other.findById(postid);
  let id='';
  for(let i=0;i<email.length;i++){
    if(email[i]=='.'){
      break;
    }
    id+=email[i];
  }
  const isliked=post.likes.get(id)
  if(checking){
    if(isliked){
      res.json({yes:true,number:post.likes.size})
    }
    else{
      res.json({yes:false,number:post.likes.size})
    }
  }
  else{
  if(isliked){
    post.likes.delete(id)
    res.json({yes:false,number:post.likes.size})
  }
  else{
    post.likes.set(id,true);
    res.json({yes:true,number:post.likes.size})
  }
  post.save()
}
})

app.post('/follow',async (req,res)=>{
  const{email,postid,checking}=req.body;
  const post=await PostImage.findById(postid);
  let id='';
  
  const follower=await User.findOne({email:email})
  const user=await User.findOne({email:post.user_id})
  for(let i=0;i<user.email.length;i++){
    if(user.email[i]=='.'){
      break;
    }
    id+=user.email[i];
  }
  if(email==user.email){
    res.json({yes:false})
  }
  else{
  const isfollowing=follower.isfollowing.get(id)

  if(checking){
    if(isfollowing){
      res.json({yes:true})
    }
    else{
      res.json({yes:false})
    }
  }
  else{
  if(isfollowing){
    follower.isfollowing.delete(id)
    const index=user.followers.indexOf(email);
    user.followers.splice(index,1);
    const ind=follower.following.indexOf(user.email)
    follower.following.splice(ind,1);
    res.json({yes:false})
  }
  else{
    follower.isfollowing.set(id,true);
    user.followers.push(email)
    follower.following.push(user.email)
    res.json({yes:true})
  }
  user.save();
  follower.save();
}}
})

app.post('/other_follow',async (req,res)=>{
  const{email,postid,checking}=req.body;
  const post=await Other.findById(postid);
  let id='';
  
  const follower=await User.findOne({email:email})
  const user=await User.findOne({email:post.user_id})
  for(let i=0;i<user.email.length;i++){
    if(user.email[i]=='.'){
      break;
    }
    id+=user.email[i];
  }
  if(email==user.email){
    res.json({yes:false})
  }
  else{
  const isfollowing=follower.isfollowing.get(id)

  if(checking){
    if(isfollowing){
      res.json({yes:true})
    }
    else{
      res.json({yes:false})
    }
  }
  else{
  if(isfollowing){
    follower.isfollowing.delete(id)
    const index=user.followers.indexOf(email);
    user.followers.splice(index,1);
    const ind=follower.following.indexOf(user.email)
    follower.following.splice(ind,1);
    res.json({yes:false})
  }
  else{
    follower.isfollowing.set(id,true);
    user.followers.push(email)
    follower.following.push(user.email)
    res.json({yes:true})
  }
  user.save();
  follower.save();
}}
})

app.post('/get_follow',async (req,res)=>{
  const{email,userf,checking}=req.body;
  let id='';
  const follower=await User.findOne({email:email})
  const user=await User.findOne({email:userf})
  if(email==user.email){
    res.json({yes:false})
  }
  else{
    for(let i=0;i<userf.length;i++){
      if(userf[i]=='.'){
        break;
      }
      id+=userf[i];
    }
  const isfollowing=follower.isfollowing.get(id)

  if(checking){
    if(isfollowing){
      res.json({yes:true})
    }
    else{
      res.json({yes:false})
    }
  }
  else{
  if(isfollowing){
    follower.isfollowing.delete(id)
    const index=user.followers.indexOf(email);
    user.followers.splice(index,1);
    const ind=follower.following.indexOf(user.email)
    follower.following.splice(ind,1);
    res.json({yes:false})
  }
  else{
    follower.isfollowing.set(id,true);
    user.followers.push(email)
    follower.following.push(user.email)
    res.json({yes:true})
  }
  user.save();
  follower.save();
}}
})

app.post('/get_followers',async (req,res)=>{
  
  const user=await User.findOne({email:req.body.email});
  let data=[];
  for(let i=0;i<user.followers.length;i++){
    const newUser=await User.findOne({email:user.followers[i]})
    data.push(newUser)
  }
  res.json(data) 
})

app.post('/get_following',async (req,res)=>{
  
  const user=await User.findOne({email:req.body.email});
  let data=[];
  for(let i=0;i<user.following.length;i++){
    const newUser=await User.findOne({email:user.following[i]})
    data.push(newUser)
  }
  res.json(data) 
})


app.post('/comment',async (req,res)=>{
  const {postid,userid,name,text}=req.body
  const post=await PostImage.findById(postid)
  const time=new Date()
  post.comments.push({profimg:userid,name:name,text:text,time:time})
  post.save()
  res.json("ok")
  
})
app.post('/other_comment',async (req,res)=>{
  const {postid,userid,name,text}=req.body
  const post=await Other.findById(postid)
  const time=new Date()
  post.comments.push({profimg:userid,name:name,text:text,time:time})
  post.save()
  res.json("ok")
  
})
app.post('/get_comments',async (req,res)=>{
  const {postid}=req.body
  const post=await PostImage.findById(postid)
  
  res.json(post.comments)
  
})
app.post('/get_other_comments',async (req,res)=>{
  const {postid}=req.body
  const post=await Other.findById(postid)
  
  res.json(post.comments)
  
})

app.post('/get_users',async (req,res)=>{
  const email=req.body.user;
  
  const users=await User.find({email:{$ne:email}})

  res.json(users)
  
})
app.post('/get_followers_count',async (req,res)=>{
  const email=req.body.email
  const user=await User.findOne({email:email})
  res.json(user.followers.length);
})
app.post('/get_following_count',async (req,res)=>{
  const email=req.body.email
  const user=await User.findOne({email:email})
  res.json(user.following.length);
})
app.post('/get_posts_count',async (req,res)=>{
  const email=req.body.email
  const posts=await PostImage.find({user_id:email})
  const others=await Other.find({user_id:email})
  res.json(posts.length+others.length);
})

app.post('/get_user_info',async (req,res)=>{
  const email=req.body.email
  const user=await User.findOne({email:email})
  res.json(user);
})





app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

