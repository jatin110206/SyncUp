const router=require('express').Router();
const authMiddleware=require('../middleware/authMiddleware');
const Chat=require('../model/chat');

router.post('/createNewChat',authMiddleware,async(req,res)=>{
    try{
        const chat = new Chat({
            members: req.body.members,
            lastMessage: req.body.lastMessage || "",
            unreadCount: req.body.unreadCount || 0
        });

        const savedChat=await chat.save();
        res.status(201).json({chat:savedChat});
    }catch(err){
        console.error('Error creating new chat:',err);
        res.status(500).json({message:'Creating new chat failed!',error:err.message});
    }
});

router.get('/allChats',authMiddleware,async(req,res)=>{
    try{
        const userId=req.userData?.userId || req.userData?.id;
        if(!userId){
            return res.status(400).json({message:'User ID not found in token!'});
        }

        const chats=await Chat.find({members:{$in:[userId]}}).populate('members','-password');
        res.status(200).json({chats});
    }catch(err){
        console.error('Error fetching all chats:',err);
        res.status(500).json({message:'Fetching chats failed!',error:err.message});
    }
});


module.exports=router;