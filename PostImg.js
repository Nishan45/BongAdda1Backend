const mongoose=require('mongoose');


const PostSchema=new mongoose.Schema({
    user_id:{
        type:String, 
        required:true
    },
    image:{
        type:String,
        required:true
    },
    profImg:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    discription:String,
    
    likes:{
        type:Map,
        of:Boolean
    },
    comments:{
        type:Array,
        default:[]
    },
    shared:{
        type:Map,
        of:Boolean,
        default:{}
    },
    

}, {timestamps:true}
);
    
module.exports=mongoose.model('PostImg',PostSchema);