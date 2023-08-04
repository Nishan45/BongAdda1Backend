const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
    },
    profImg:{
        type:String,
        default:"./assets/grey.png"
    },
    backgroundImg:{
        type:String,
        default:"./assets/grey.png"
    },
    location:{
        type:String,
        default:""
    },
    occupation:{
        type:String,
        default:""
    },
    followers:{
        type:Array,
        default:[]
    },
    following:{
        type:Array,
        default:[]
    },
    isfollowing:{
        type:Map,
        of:Boolean
    }
},{timestamps:true});
    
module.exports=mongoose.model('user',userSchema);