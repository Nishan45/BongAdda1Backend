const mongoToConnect=require('./db')
mongoToConnect()

const compression=require('compression')
const express = require('express')
const app = express()
const port = 3000
const Cors=require('cors')


app.use(Cors())
app.use(express.json());
app.use(compression({level:6,threshold:0}))
  


const { body, validationResult } = require('express-validator');

const User = require('./User');
const  PostImage  = require('./PostImg')
const Other=require('./Other')

const notification_limit=50

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
  const data=await User.findOne({email:email,password:password},{notifications:false})
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
  const skip=req.body.skip;
  const time=req.body.time;
  let limit=req.body.limit;
  if(!limit){
    limit=6;
  }
  let Data=await PostImage.find({createdAt:{$lte:time}}).sort({ _id: -1 }).skip(skip).limit(limit).exec();
  const email=req.body.email
  let id=''
  if(email){
  for(let i=0;i<email.length;i++){
    if(email[i]=='.'){
      break;
    }
    id+=email[i];
  }

  for(let i=0;i<Data.length;i++){
    if(Data[i].likes.get(id)){
      
      Data[i]._doc['likedby']=true
    }
    else{
      Data[i]._doc['likedby']=false
    }
  }
}
  
  res.json(Data);
  Data=[]
})
app.post('/get_trending_posts',async (req,res)=>{
  const skip=req.body.skip;
  const time=req.body.time;
  let limit=req.body.limit;
  if(!limit){
    limit=6;
  }
  let Data=await PostImage.find({updatedAt:{$lte:time}}).sort({shareCount:-1,likeCount:-1,commentsCount:-1,_id:-1,updatedAt:-1,createdAt:-1}).skip(skip).limit(limit).exec();
  const email=req.body.email
  if(email){
  let id=''
  for(let i=0;i<email.length;i++){
    if(email[i]=='.'){
      break;
    }
    id+=email[i];
  }

  for(let i=0;i<Data.length;i++){
    if(Data[i].likes.get(id)){
      
      Data[i]._doc['likedby']=true
    }
    else{
      Data[i]._doc['likedby']=false
    }
  }}
  
  res.json(Data);
  Data=[]
})
app.post('/get_user_images',async (req,res)=>{
  const {email,user_email}=req.body
  let Data=await PostImage.find({user_id:email}).sort({ _id: -1 })
  if(user_email){
  let id=''
  for(let i=0;i<user_email.length;i++){
    if(user_email[i]=='.'){
      break;
    }
    id+=user_email[i];
  }

  for(let i=0;i<Data.length;i++){
    if(Data[i].likes.get(id)){
      
      Data[i]._doc['likedby']=true
    }
    else{
      Data[i]._doc['likedby']=false
    }
  }}
  
  res.json(Data);
  Data=[]
})
app.post('/get_stories',async (req,res)=>{
  const {category,skip,time}=req.body;
  let limit=req.body.limit;
  if(!limit){
    limit=6;
  }
  
  let Data=await Other.find({category:category,createdAt:{$lte:time}}).sort({ _id: -1 }).skip(skip).limit(limit).exec()
  const email=req.body.email
  if(email){
  let id=''
  for(let i=0;i<email.length;i++){
    if(email[i]=='.'){
      break;
    }
    id+=email[i];
  }

  for(let i=0;i<Data.length;i++){
    if(Data[i].likes.get(id)){
      
      Data[i]._doc['likedby']=true
    }
    else{
      Data[i]._doc['likedby']=false
    }
  }}
  
  res.json(Data);
  Data=[]
})
app.post('/get_trending_stories',async (req,res)=>{
  const {category,skip,time}=req.body;
  let limit=req.body.limit;
  if(!limit){
    limit=6;
  }
  let Data=await Other.find({category:category,updatedAt:{$lte:time}}).sort({shareCount:-1,likeCount:-1,commentsCount:-1,_id:-1,updatedAt:-1,createdAt:-1}).skip(skip).limit(limit).exec()
  const email=req.body.email
  if(email){
  let id=''
  for(let i=0;i<email.length;i++){
    if(email[i]=='.'){
      break;
    }
    id+=email[i];
  }

  for(let i=0;i<Data.length;i++){
    if(Data[i].likes.get(id)){
      
      Data[i]._doc['likedby']=true
    }
    else{
      Data[i]._doc['likedby']=false
    }
  }
}
  res.json(Data);
  Data=[]
})
app.post('/get_user_stories',async (req,res)=>{
  const {category,email,user_email}=req.body;
  let Data=await Other.find({category:category,user_id:email}).sort({ _id: -1 })
  if(user_email){
  let id=''
  for(let i=0;i<user_email.length;i++){
    if(user_email[i]=='.'){
      break;
    }
    id+=user_email[i];
  }

  for(let i=0;i<Data.length;i++){
    if(Data[i].likes.get(id)){
      
      Data[i]._doc['likedby']=true
    }
    else{
      Data[i]._doc['likedby']=false
    }
  }}
  
  res.json(Data);
  Data=[]
})
app.post('/like',async (req,res)=>{
  const{email,postid,checking}=req.body;
  const post=await PostImage.findById(postid);
  const user=await User.findOne({email:post.user_id});
  const from=await User.findOne({email:email})
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
    if(user.email!=from.email){
    user.newnotification=true;
    user.notifications.push({name:from.name,text:"আপনার পোস্ট Like করেছেন",profimg:from.profImg,category:"image",postid:post._id,from:from.email,time:new Date()})
    }
    if(user.notifications.length>notification_limit){
      user.notifications.shift(0);
    }
    res.json({yes:true,number:post.likes.size})
  }
  post.likeCount=post.likes.size;
  user.save()
  post.save()
}
})
app.post('/other_like',async (req,res)=>{
  const{email,postid,checking}=req.body;
  const post=await Other.findById(postid);
  const from=await User.findOne({email:email})
  const user=await User.findOne({email:post.user_id})
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
    if(user.email!=from.email){
    user.newnotification=true;
    user.notifications.push({name:from.name,text:"আপনার পোস্ট Like করেছেন",profimg:from.profImg,category:post.category,from:from.email,postid:post._id,time:new Date()})
    if(user.notifications.length>notification_limit){
      user.notifications.shift(0);
    }
    res.json({yes:true,number:post.likes.size})
  }}
  post.likeCount=post.likes.size;
  user.save();
  post.save();
  }
})

app.post('/profile_follow',async (req,res)=>{
  const{email,follow,checking}=req.body;

  const follower=await User.findOne({email:email})
  const user=await User.findOne({email:follow})
  let id='';
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
    user.newnotification=true;
    user.notifications.push({name:follower.name,text:" আপনাকে অনুসরণ করছেন",profimg:follower.profImg,category:"follow",from:follower.email,time:new Date()})
    if(user.notifications.length>notification_limit){
      user.notifications.shift(0);
    }
    res.json({yes:true})
  }
  user.save();
  follower.save();
}}
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
    user.newnotification=true;
    user.notifications.push({name:follower.name,text:" আপনাকে অনুসরণ করছেন",profimg:follower.profImg,category:"follow",from:follower.email,time:new Date()})
    if(user.notifications.length>notification_limit){
      user.notifications.shift(0);
    }
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
    user.newnotification=true;
    user.notifications.push({name:follower.name,text:" আপনাকে অনুসরণ করছেন",profimg:follower.profImg,category:"follow",from:follower.email,time:new Date()})
    if(user.notifications.length>notification_limit){
      user.notifications.shift(0);
    }
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
    user.newnotification=true;
    user.notifications.push({name:follower.name,text:" আপনাকে অনুসরণ করছেন",profimg:follower.profImg,category:"follow",from:follower.email,time:new Date()})
    if(user.notifications.length>notification_limit){
      user.notifications.shift(0);
    }
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

app.post('/get_followers_share',async (req,res)=>{
  const {email,postid,category}=req.body;
  const user=await User.findOne({email:email});
  
  if(category=='image'){
    const post=await PostImage.findOne({_id:postid});
  
  let data=[];
  for(let i=0;i<user.followers.length;i++){
    const newUser=await User.findOne({email:user.followers[i]})
    const em=newUser.email;
    let val='';
    for(let j=0;j<em.length;j++){
      if(em[j]=='.'){
        break;
      }
      val+=em[j];
    }
    const done=post.shared.get(val);
    if(!done && em!=post.user_id){
    data.push(newUser)
    
    }
  }
  res.json(data) 
}
  else{
   
      const post=await Other.findOne({_id:postid});
    
    let data=[];
    for(let i=0;i<user.followers.length;i++){
      const newUser=await User.findOne({email:user.followers[i]})
      const em=newUser.email;
    let val='';
    for(let j=0;j<em.length;j++){
      if(em[j]=='.'){
        break;
      }
      val+=em[j];
    }
      const done=post.shared.get(val);
      if(!done && em!=post.user_id){
      data.push(newUser)
      }
    }
  
    res.json(data) 
  
  }
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
  const {postid,userid,text}=req.body
  const post=await PostImage.findById(postid)
  const user=await User.findOne({email:userid})
  const time=new Date()
  post.comments.push({profimg:user.profImg,name:user.name,text:text,time:time,email:user.email})
  post.commentsCount=post.comments.length;
  post.save()
  res.json("ok")
  
})
app.post('/other_comment',async (req,res)=>{
  const {postid,userid,text}=req.body
  const post=await Other.findById(postid)
  const user=await User.findOne({email:userid})
  const time=new Date()
  post.comments.push({profimg:user.profImg,name:user.name,text:text,time:time,email:user.email})
  post.commentsCount=post.comments.length;
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
  
  const {email,query,skip}=req.body
  const users=await User.find({email:{$ne:email},name:{"$regex":'^'+query, "$options": 'i'}},{password:false,discription:false,notifications:false,following:false,isfollowing:false,newnotification:false,createdAt:false,updatedAt:false,about:false,backgroundImg:false,followers:false}).sort({createdAt:1}).skip(skip).limit(20).exec()
  
  res.json(users)
  
})
app.post('/get_users_share',async (req,res)=>{
  const {email,postid,category}=req.body;
  const user=await User.find({email:{$ne:email}});
  
  if(category=='image'){
    const post=await PostImage.findOne({_id:postid});
  
  let data=[];
  for(let i=0;i<user.length;i++){
    let val='';
    for(let j=0;j<user[i].email.length;j++){
      if(user[i].email[j]=='.'){
        break;
      }
      val+=user[i].email[j];
    }
    const done=post.shared.get(val);
    if(!done && post.user_id!=user[i].email){
    data.push(user[i])
    }
  }
  res.json(data) 
  data=[]
}
  else{
   
      const post=await Other.findOne({_id:postid});
    
    let data=[];
    for(let i=0;i<user.length;i++){
      let val='';
    for(let j=0;j<user[i].email.length;j++){
      if(user[i].email[j]=='.'){
        break;
      }
      val+=user[i].email[j];
    }
      
      const done=post.shared.get(val);
      if(!done && post.user_id!=user[i].email){
      data.push(user[i])
      }
    }
    res.json(data) 
    data=[]
  
  }
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
  const user=await User.findOne({email:email})
  res.json({post:posts.length+others.length,follower:user.followers.length,following:user.following.length});
})

app.post('/get_user_info',async (req,res)=>{
  const email=req.body.email
  const user=await User.findOne({email:email})
  res.json(user);
})

app.post('/edit_profile',async (req,res)=>{
  const name=req.body.name;
  const about=req.body.about;
  const email=req.body.email;
  const discription=req.body.discription;
  const user=await User.findOne({email:email})
  user.name=name;
  user.about=about;
  user.discription=discription;
  user.save();
  res.json('ok')
})

app.post('/newnotification',async (req,res)=>{
  const email=req.body.email
  const user=await User.findOne({email:email})
  res.json(user.newnotification)
})
app.post('/notify',async (req,res)=>{
  const email=req.body.email;
  const val=req.body.val;
  const user=await User.findOne({email:email});
  user.newnotification=val;
  user.save();
  res.sendStatus(200);
})

app.post('/get_notification',async (req,res)=>{
 
  const {email,skip,limit,time}=req.body;
  const user=await User.findOne({email:email})
  let data=user.notifications.filter(function(x){
    
    return JSON.stringify(x.time)<=time;
  }).reverse().slice(skip,skip+limit)
  
  res.json(data)
  data=[]
})

app.post('/delete',async (req,res)=>{
 
  const {email,item}=req.body
  const user=await User.findOne({email:email})
  const index=user.notifications.findIndex(items=>(items.postid==item.postid && item.name==items.name && new Date(item.time).getTime()==new Date(items.time).getTime() && item.from==items.from && item.profimg==items.profimg && item.text==items.text && item.category==items.category))
  
  if(index>-1){
    user.notifications.splice(index,1);
  }
  user.save()
  res.json('ok')
})

app.post('/share',async (req,res)=>{
 
  const {self,to,postid,category,text}=req.body;

  const user=await User.findOne({email:to})
  const curuser=await User.findOne({email:self})
  const time=new Date();
  let post={}
  if(category=='image'){
  post=await PostImage.findOne({_id:postid})
  }
  else{
    post=await Other.findOne({_id:postid})
  }
  let email='';
  for(let i=0;i<to.length;i++){
    if(to[i]=='.') break;
    email+=to[i];
  }
  if(!post.shared.get(email)){
  post.shared.set(email,true);
  user.notifications.push({from:self,category:category,postid:postid,name:curuser.name,text:text,time:time,profimg:curuser.profImg})
  user.newnotification=true;
  post.shareCount=post.shared.size;
  user.save();
  post.save();
  }
  res.json('ok')
})

app.post('/get_post_info',async (req,res)=>{
  const{postid,category}=req.body;
  if(category=='image'){
    const post=await PostImage.findOne({_id:postid})
    res.json(post)
  }
  else{
    const post=await Other.findOne({_id:postid})
    res.json(post)
  }
})

app.post('/change_password',async (req,res)=>{
  const {email,password}=req.body
  const user=await User.findOne({email:email})
  user.password=password;
  user.save();
  res.json('ok')
  
})

app.post('/valid',async (req,res)=>{

  const user=await User.findOne({email:req.body.email})
  if(user && req.body.password==user.password){
    res.json(user)
  }
  else{
    res.json('')
  }
  
})


app.get('/test',async (req,res)=>{
  const skip=0;
  const time=new Date();
  let Data=await PostImage.find({createdAt:{$lte:time}}).sort({ _id: -1 }).skip(skip).limit(4).exec();
  res.send(Data);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

