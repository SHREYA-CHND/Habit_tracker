require("dotenv").config()

const express = require("express")
const { Pool } = require("pg")
const nodemailer = require("nodemailer")
const bcrypt = require("bcrypt")

const app = express()

app.use(express.static(__dirname))
app.use(express.json())

const db = new Pool({
 user:process.env.DB_USER,
 password:process.env.DB_PASSWORD,
 host:process.env.DB_HOST,
 port:process.env.DB_PORT,
 database:process.env.DB_NAME
})

/* ================= EMAIL ================= */

const transporter = nodemailer.createTransport({
 service:"gmail",
 auth:{
  user:process.env.EMAIL_USER,
  pass:process.env.EMAIL_PASS
 }
})

/* ================= REGISTER ================= */

app.post("/register", async(req,res)=>{

 const {name,email,password} = req.body
 const code = Math.floor(100000 + Math.random()*900000).toString()
 const hashed = await bcrypt.hash(password,10)

 try{

  await db.query(
   "INSERT INTO users(name,email,password,verified,xp,avatar_stage) VALUES($1,$2,$3,false,0,0)",
   [name,email,hashed]
  )

  await db.query(
   "INSERT INTO verification_codes(email,code) VALUES($1,$2)",
   [email,code]
  )

  await transporter.sendMail({
   from:process.env.EMAIL_USER,
   to:email,
   subject:"Verification Code",
   text:"Your verification code is: "+code
  })

  res.json({status:"verify",message:"Verification code sent"})

 }catch{
  res.json({message:"User already exists"})
 }

})

/* ================= VERIFY ================= */

app.post("/verify", async(req,res)=>{

 const {email,code}=req.body

 const data=await db.query(
  "SELECT * FROM verification_codes WHERE email=$1 AND code=$2",
  [email,code]
 )

 if(data.rows.length===0)
  return res.json({success:false})

 await db.query("UPDATE users SET verified=true WHERE email=$1",[email])
 await db.query("DELETE FROM verification_codes WHERE email=$1",[email])

 res.json({success:true})

})

/* ================= LOGIN ================= */

app.post("/login", async(req,res)=>{

 const {email,password}=req.body

 const user=await db.query("SELECT * FROM users WHERE email=$1",[email])

 if(user.rows.length===0)
  return res.json({success:false,message:"Invalid email"})

 const valid=await bcrypt.compare(password,user.rows[0].password)

 if(!valid)
  return res.json({success:false,message:"Wrong password"})

 if(!user.rows[0].verified)
  return res.json({success:false,message:"Verify email first"})

 res.json({success:true,id:user.rows[0].id})

})

/* ================= USER ================= */

app.get("/user/:id", async(req,res)=>{

 const user=await db.query(
  "SELECT xp,avatar_stage FROM users WHERE id=$1",
  [req.params.id]
 )

 res.json(user.rows[0])

})

/* ================= CREATE HABIT ================= */

app.post("/habit", async (req,res)=>{

 const {user_id,name,day} = req.body

 try{

  /* ASK LLAMA TO CLASSIFY HABIT */

  const ai = await fetch("http://localhost:11434/api/generate",{
   method:"POST",
   headers:{
    "Content-Type":"application/json"
   },
   body:JSON.stringify({
    model:"llama3",
    prompt:`
You are a habit classifier.

Classify the following habit as GOOD or BAD.

Rules:
GOOD = improves health, productivity, learning, discipline
BAD = harmful, addictive, unhealthy, procrastination

Only answer with GOOD or BAD.

Habit: ${name}
`,
    stream:false
   })
  })

  const data = await ai.json()

  const result = data.response.trim().toUpperCase()

  let type = result.includes("BAD") ? "BAD" : "GOOD"


  /* IF BAD HABIT → OPEN CHATBOT */

  if(type==="BAD"){
   return res.json({
    habit_type:"BAD",
    message:"This looks like a harmful habit. AI assistant activated."
   })
  }


  /* SAVE GOOD HABIT */

  const q=`
  INSERT INTO habits(user_id,habit_name,day)
  VALUES($1,$2,$3)
  RETURNING id
  `

  const dbResult = await db.query(q,[user_id,name,day])

  res.json({
   habit_id:dbResult.rows[0].id,
   habit_type:type
  })

 }
 catch(err){

  console.error(err)

  res.status(500).json({
   error:"AI classification failed"
  })

 }

})
/* ================= GET HABITS ================= */

app.get("/habits/:user", async (req, res) => {

 try{

  const userId=parseInt(req.params.user)

  if(!userId){
   return res.json({error:"Invalid user id"})
  }

  const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
  const today=days[new Date().getDay()]

  const data=await db.query(`
   SELECT h.*,
   EXISTS(
    SELECT 1 FROM habit_logs l
    WHERE l.habit_id=h.id
    AND DATE(l.log_date)=CURRENT_DATE
   ) AS completed
   FROM habits h
   WHERE user_id=$1 AND day=$2
  `,[userId,today])

  res.json(data.rows)

 }catch(err){

  console.error(err)
  res.status(500).json({error:"Server error"})

 }

})

/* ================= DELETE HABIT ================= */

app.delete("/habit/:id", async(req,res)=>{

 await db.query("DELETE FROM habits WHERE id=$1",[req.params.id])

 res.json({status:"deleted"})

})

/* ================= COMPLETE HABIT ================= */

app.post("/habit-complete", async(req,res)=>{

 const {user_id,habit_id}=req.body

 const already=await db.query(
  "SELECT * FROM habit_logs WHERE user_id=$1 AND habit_id=$2 AND DATE(log_date)=CURRENT_DATE",
  [user_id,habit_id]
 )

 if(already.rows.length>0)
  return res.json({message:"Already completed today"})

 await db.query(
  "INSERT INTO habit_logs(user_id,habit_id,log_date,completed,xp_earned) VALUES($1,$2,NOW(),true,10)",
  [user_id,habit_id]
 )

 await db.query("UPDATE users SET xp=xp+10 WHERE id=$1",[user_id])

 await db.query(`
 UPDATE users SET avatar_stage=
 CASE
  WHEN xp>300 THEN 3
  WHEN xp>150 THEN 2
  WHEN xp>50 THEN 1
  ELSE 0
 END
 WHERE id=$1
 `,[user_id])

 res.json({message:"XP gained"})

})

/* ================= DAILY PROGRESS ================= */

app.get("/daily-progress/:user", async(req,res)=>{

 const data=await db.query(`
 SELECT DATE(log_date) as day,
 SUM(xp_earned) as xp
 FROM habit_logs
 WHERE user_id=$1
 GROUP BY day
 ORDER BY day
 `,[req.params.user])

 res.json(data.rows)

})

/* ================= AI MUSIC ================= */

app.post("/ai-music", async(req,res)=>{

 const task=req.body.task

 let query="focus music"

 if(task.toLowerCase().includes("study")) query="deep focus study music"
 if(task.toLowerCase().includes("gym")) query="high energy workout music"
 if(task.toLowerCase().includes("sleep")) query="sleep meditation music"

 res.json({query})

})

app.post("/ai-fix",(req,res)=>{

 const {habit}=req.body

 let advice="Try replacing this with a healthier alternative."

 if(habit.includes("smoke")){
  advice="Replace smoking with chewing gum or a short walk."
 }

 if(habit.includes("drink")){
  advice="Replace alcohol with water or fruit juice."
 }

 if(habit.includes("junk")){
  advice="Try fruits or nuts instead of junk food."
 }

 if(habit.includes("late")){
  advice="Set a fixed sleep alarm and avoid screens."
 }

 res.json({advice})

})

/* ================= SETTINGS ================= */

app.post("/change-password", async(req,res)=>{

 const {email,newpass}=req.body
 const hashed=await bcrypt.hash(newpass,10)

 await db.query(
  "UPDATE users SET password=$1 WHERE email=$2",
  [hashed,email]
 )

 res.json({status:"updated"})

})

app.delete("/delete-user/:id", async(req,res)=>{

 await db.query("DELETE FROM habit_logs WHERE user_id=$1",[req.params.id])
 await db.query("DELETE FROM habits WHERE user_id=$1",[req.params.id])
 await db.query("DELETE FROM users WHERE id=$1",[req.params.id])

 res.json({status:"deleted"})

})

app.listen(process.env.PORT,()=>{
 console.log("Server running")
})

/* ================= Chat Box ================= */

app.post("/ai-chat", async(req,res)=>{

 const {message}=req.body

 const response = await fetch("http://localhost:11434/api/generate",{
  method:"POST",
  headers:{
   "Content-Type":"application/json"
  },
  body:JSON.stringify({
   model:"llama3",
   prompt:`You are a helpful habit coach. Help the user break bad habits and suggest healthy alternatives.\nUser: ${message}`,
   stream:false
  })
 })

 const data = await response.json()

 res.json({reply:data.response})

})

app.post("/start-focus",(req,res)=>{

 const {user_id,minutes}=req.body

 if(!user_id || !minutes){
  return res.json({success:false})
 }

 console.log(`User ${user_id} started focus for ${minutes} minutes`)

 res.json({success:true})

})