import User from "../modals/user.js";

export const getTotalUsers = async(req,res)=>{
    try {
        const totalUsers = await User.find().count();
        res.send(totalUsers);
    } catch (error) {
        res.send({success:"false",message:error.message});
    }
};

