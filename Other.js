const mongoose=require('mongoose')

const OtherSchema=new mongoose.Schema({
    user_id:{
        type:String, 
        required:true
    },
    category:{
        type:String,
        
    },
    title:String,
    body:{
        type:String,
        required:true,
    },
    author:{
        type:String,
    },
    
    profImg:{
        type:String,
    },
    name:{
        type:String,
        required:true
    },
    
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
    }

}, {timestamps:true}
);
    
module.exports=mongoose.model('Other',OtherSchema);