/* ================= SESSION SYSTEM ================= */

window.focusMode = false
let timer

function resetTimer(){

clearTimeout(timer)

timer=setTimeout(()=>{
if(!window.focusMode){
localStorage.removeItem("user")
window.location="index.html"
}
},600000)

}

if(localStorage.getItem("focusMode")){
window.focusMode=true
}

document.onclick=resetTimer
document.onkeypress=resetTimer
resetTimer()

/* ================= LOGIN ================= */

async function login(){

const email=document.getElementById("email").value
const password=document.getElementById("password").value

const res=await fetch("/login",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({email,password})
})

const data=await res.json()

if(data.success){
localStorage.setItem("user",data.id)
window.location="dashboard.html"
}else{
alert(data.message)
}

}

/* ================= REGISTER ================= */

async function register(){

const name=document.getElementById("name").value
const email=document.getElementById("email").value
const password=document.getElementById("password").value

localStorage.setItem("verify_email",email)

const res=await fetch("/register",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({name,email,password})
})

const data=await res.json()

alert(data.message)

if(data.status==="verify"){
window.location="verify.html"
}

}

/* ================= VERIFY EMAIL ================= */

async function verify(){

const email=localStorage.getItem("verify_email")
const code=document.getElementById("code").value

const res=await fetch("/verify",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({email,code})
})

const data=await res.json()

if(data.success){
alert("Account verified")
window.location="index.html"
}else{
alert("Wrong code")
}

}

/* ================= CREATE HABIT ================= */

async function createHabit(){

const name=document.getElementById("habit").value
const day=document.getElementById("day").value

const res=await fetch("/habit",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
user_id:localStorage.user,
name,
day
})
})

const data=await res.json()

if(data.habit_type==="BAD"){

alert("Bad habit detected")

const ai=document.getElementById("aiChat")
const chat=document.getElementById("chatBox")

if(ai) ai.style.display="block"

if(chat){
chat.innerHTML+=`

   <div><b>AI:</b> I noticed this might be a harmful habit.
   Would you like help improving it?</div>
   `
  }

}

loadHabits()

}

/* ================= DELETE HABIT ================= */

async function deleteHabit(id){

await fetch("/habit/"+id,{method:"DELETE"})
loadHabits()

}

/* ================= LOAD HABITS ================= */

async function loadHabits(){

const list=document.getElementById("habitList")
if(!list) return

const res=await fetch("/habits/"+localStorage.user)
const habits=await res.json()

list.innerHTML=""

habits.forEach(h=>{

const li=document.createElement("li")

const checked = h.completed ? "checked" : ""

li.innerHTML=
`<input type="checkbox" ${checked} onclick="complete(${h.id})">
  ${h.habit_name}   <button onclick="deleteHabit(${h.id})">Delete</button>`

list.appendChild(li)

})

}

/* ================= COMPLETE HABIT ================= */

async function complete(id){

const res=await fetch("/habit-complete",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
user_id:localStorage.user,
habit_id:id
})
})

const data=await res.json()

alert(data.message)

loadDashboard()

}

/* ================= DASHBOARD ================= */

async function loadDashboard(){

if(!localStorage.user) window.location="index.html"

await loadHabits()

const res=await fetch("/user/"+localStorage.user)
const user=await res.json()

const xp=document.getElementById("xpText")
if(xp) xp.innerText="XP: "+user.xp

updateAvatar(user.avatar_stage)

createChart()

}

/* ================= AVATAR ================= */

function updateAvatar(stage){

const avatars=[
"avatars/skinny.png",
"avatars/normal.png",
"avatars/fit.png",
"avatars/buff.png"
]

const avatar=document.getElementById("avatar")
if(avatar) avatar.src=avatars[stage]

}

/* ================= CHART ================= */

async function createChart(){

const ctx=document.getElementById("xpChart")
if(!ctx) return

const res=await fetch("/daily-progress/"+localStorage.user)
const data=await res.json()

const labels=data.map(d=>d.day)
const xp=data.map(d=>d.xp)

if(window.chart) window.chart.destroy()

window.chart=new Chart(ctx,{
type:"line",
data:{
labels,
datasets:[{
label:"Daily XP",
data:xp,
borderColor:"#3b82f6",
fill:false
}]
}
})

}

/* ================= FOCUS MODE ================= */

let focusTimer
let focusLocked=false

function resetFocusMode(){
    
    focusLocked=false
    window.focusMode=false
    localStorage.removeItem("focusMode")
    
    const minuteInput=document.getElementById("focusMinutes")
    const musicSelect=document.getElementById("focusMusic")
    const player=document.getElementById("ytplayer")
    const text=document.getElementById("timerText")
    
    if(minuteInput){
        minuteInput.disabled=false
        minuteInput.value=""
    }
    
    if(musicSelect){
        musicSelect.disabled=false
        musicSelect.value=""
    }
    
    if(player){
        player.src=""
    }
    
    if(text){
        text.innerText="Set your focus session"
    }
    
    if(focusTimer){
        clearInterval(focusTimer)
        focusTimer=null
    }
    
    if(document.fullscreenElement){
        document.exitFullscreen().catch(()=>{})
    }
}

function startFocusMode(){

if(focusLocked) return

const minuteInput=document.getElementById("focusMinutes")
const musicSelect=document.getElementById("focusMusic")

const minutes=minuteInput.value
const music=musicSelect.value

if(!minutes || minutes<=0){
alert("Enter valid focus time")
return
}

focusLocked=true
window.focusMode=true
localStorage.setItem("focusMode","true")

minuteInput.disabled=true
musicSelect.disabled=true

/* START MUSIC IN BACKGROUND */

if(music){

const player=document.getElementById("ytplayer")

if(player){
player.src=
"https://www.youtube.com/embed/"+music+"?autoplay=1&loop=1&playlist="+music
}

}

/* FULLSCREEN (must be user click) */

if(document.documentElement.requestFullscreen){
document.documentElement.requestFullscreen()
}

startTimer(minutes)

fetch("/start-focus",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
user_id:localStorage.user,
minutes
})
})

}

function startTimer(minutes){

let remaining=minutes*60
const text=document.getElementById("timerText")

focusTimer=setInterval(()=>{

remaining--

const m=Math.floor(remaining/60)
const s=remaining%60

if(text){
text.innerText="Focus Time: "+m+":"+String(s).padStart(2,"0")
}

if(remaining<=0){

clearInterval(focusTimer)

resetFocusMode()

alert("Focus session complete")

}

},1000)

}

document.addEventListener("visibilitychange",()=>{

if(document.hidden && focusLocked){
alert("Focus mode active. Stay focused!")
window.focus()
}

})

/* ================= INITIALIZATION ================= */

window.addEventListener("DOMContentLoaded",()=>{

if(document.getElementById("focusMinutes") || document.getElementById("focusMusic")){
resetFocusMode()
}

})

/* ================= THEME ================= */

function setTheme(mode){

localStorage.setItem("theme",mode)
document.body.className=mode

}

function loadTheme(){

const theme = localStorage.getItem("theme")

if(theme && document.body){
document.body.className = theme
}

}

window.addEventListener("DOMContentLoaded", loadTheme)

/* ================= PASSWORD CHANGE ================= */

async function changePassword(){

const email=document.getElementById("email").value
const pass=document.getElementById("newpass").value

await fetch("/change-password",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({email,newpass:pass})
})

alert("Password updated")

}

/* ================= DELETE ACCOUNT ================= */

async function deleteAccount(){

await fetch("/delete-user/"+localStorage.user,{
method:"DELETE"
})

localStorage.removeItem("user")
window.location="index.html"

}

/* ================= CHAT ================= */

async function sendChat(){

const input=document.getElementById("chatInput")
const chat=document.getElementById("chatBox")

if(!chat || !input) return

const message=input.value

chat.innerHTML+=`<div><b>You:</b> ${message}</div>`

input.value=""

const res=await fetch("/ai-chat",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({message})
})

const data=await res.json()

chat.innerHTML+=`<div><b>AI:</b> ${data.reply}</div>`

chat.scrollTop=chat.scrollHeight

}
