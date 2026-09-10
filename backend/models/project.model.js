import mongoose from "mongoose"

const projectSchema = new mongoose.Schema({
    name:{
        type:String
    },
    owner:[{
        ownerid: {
         type:mongoose.Schema.Types.ObjectId,
         ref:"User"
     },
     ownerEmail:{
         type:String,
     },
     ownerName:{
         type:String,
     }
 }],
    users:[{
       userid: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    userEmail:{
        type:String,
    },
    userName:{
        type:String,
    }
}],
fileTree:{
    type:Object,
    default:{}
},
messages: {
    type: Array,
    default: []
}
})

const Project = mongoose.model("Project",projectSchema);
export default Project