import mongoose from "mongoose";

const SubscriptionSchema = new Schema ({

    subscriber :{
        type: Schema.Types.ObjectId,//one who is subscribing
        ref:"User"
    },
 
    channel : { 
        type: Schema.Types.ObjectId,//one to whom sub is subscribing
        ref:"User"
    }

},
    {timestamps :true})


export const Subscription = mongoose.model("Subscription",SubscriptionSchema)