const express = require('express');
const fetch = require('node-fetch');
const _ = require('lodash');
const path = require('path');
const nodeMailer = require('nodemailer');

/// APP ///
const app = express()


/////////////////////////////////////////////////////////
//////////////////////// TODOS //////////////////////////
/////////////////////////////////////////////////////////




/////////////////////////////////////////////////////////
///////////// REFRESH SETTINGS //////////////////////////
/////////////////////////////////////////////////////////
const MIN_REFRESH_TIME = 1
const LOOP_REFRESH_TIME = 20

////////////////////////////////////////////////////
const REFRESH_TIME_MILISECONDS = MIN_REFRESH_TIME*60000
const LOOP_REFRESH_TIME_MILISECONDS = LOOP_REFRESH_TIME*60000
const riotKey = require('./riotKey.js');

/////////////////////////////////////////////////////////
///////////// GLOBAL THINGS TO USE //////////////////////
/////////////////////////////////////////////////////////
let lastRefreshTime = new Date(1683068581412);
var matchesData = [];
var matchNameList = [];
var summs = {};
var runes = {};
let myPUUID = "4hMaaZ_gOQ3raaAYwIetAWMul0SykB9gNug5cz9h_3HDUuzZ32n2m_49nr3aThN3ro5llCDvwXiBFw";
let team = [
    "4hMaaZ_gOQ3raaAYwIetAWMul0SykB9gNug5cz9h_3HDUuzZ32n2m_49nr3aThN3ro5llCDvwXiBFw",//wh1t3xD
    "oYYf3Gijl3fFEQM36oQnupOjSh3AmPnqkZOg1jQY61Pot5tmcL3aZvv4EHpJvlrTniUvoxyE24Bb_g",//TomsoniakPL
    "an_xMRZNAPa56Y8vJcTPG90nAMJbD-eRhDsKfgjtcm4_QXgYebRWjwaEyUFJafWgtrTMfygRWbFbFw",//Faillonis
    "2TwgZZqQpOJOmFKk-sB4g9T4vFvOvGaxCvsqQ85E_JAWCUTMIfSzeey1ssQTo4FS8WXrnV_eC4tUHQ",//KAJXXX
    "PLouDnGvVAfpbh0ncXftLWwUEZOK0Rtszms6MZ2Pu5FHhWdOTYpvjRbEqixx-SV8L3ChEbMwaVSMIg"//Mninja57
];

async function loadRunesObject(){
    response = await fetch(`http://ddragon.leagueoflegends.com/cdn/12.16.1/data/en_US/runesReforged.json`);
    if (response.status != 200){
        console.error("Runes table not loaded! There was something wrong with this request");
        console.error(response);
        return;
    }
    response = await response.json();
    for (let k of response){
        runes[k.id] = k.icon
        for (let el of k.slots[0].runes){
            runes[el.id] = el.icon
        }
    }
    console.log("Rune library loaded succesfully!")
}

/////////////////////////////////////////////////////////
//============ LOAD SUMMONER SPELLLS OBJECT =============
/////////////////////////////////////////////////////////
async function loadSummonerSpellsObject(){
    response = await fetch(`http://ddragon.leagueoflegends.com/cdn/13.9.1/data/en_US/summoner.json`);
    if (response.status != 200){
        console.error("Summoner spells table not loaded! There was something wrong with this request");
        console.error(response);
        return;
    }
    response = await response.json();
    for (let k in response["data"]){
        summs[response["data"][k].key] = response["data"][k].image.full
    }
    console.log("Summoner spells library loaded succesfully!")
}

/////////////////////////////////////////////////////////
///////////////// REFRESH LOOP //////////////////////////
/////////////////////////////////////////////////////////
async function refreshLoop(){
    while(true){
        await new Promise(res => setTimeout(res, LOOP_REFRESH_TIME_MILISECONDS));
        refreshMatchesData();
    }
}


/////////////////////////////////////////////////////////
//============ Refresh AND LOAD MATCHES DATA =============
/////////////////////////////////////////////////////////
async function refreshMatchesData(){

    if (new Date() - lastRefreshTime >= REFRESH_TIME_MILISECONDS){
        lastRefreshTime = new Date();

        let tempData = []
        var proccessed = 0

        response = await fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${myPUUID}/ids?start=0&count=3&api_key=${riotKey}`);
        if (response.status != 200){
            console.error("There was something wrong with finding matches of PUUID player");
            console.error(response);
            return;
        }
        const matches = await response.json();

        await new Promise(res => setTimeout(res, 1000)); //Await for 1 sec cause of 20calls per sec limit
        await new Promise( (resolve) => {
            Array.from(matches).forEach( async match => {
                if (!matchNameList.includes(match)){
                    response = await fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/${match}?api_key=${riotKey}`);
                    if (response.status != 200){
                        console.error("Could not load data from game "+match);
                        console.error(response);
                        return;
                    }
                    response = await response.json();
                    let players = response.metadata.participants
                    let goodMatch = true;

                    if (response.info.gameDuration < 600){
                        goodMatch = false;
                    }else{
                        for (let p of team){
                            if (!players.includes(p)){
                                goodMatch = false;
                                break;
                            }
                        }
    
                    }

                    if(goodMatch){
                        tempData.push(response)
                        matchNameList.push(response.metadata.matchId);
                    }
                   
                }
                proccessed++;
                if (proccessed == 3){
                    resolve()
                }
               
            })
            
        })
        /////// Sort by the newest game
        tempData = _.sortBy(tempData, (match) => match.info.gameStartTimestamp).reverse();
        let count = tempData.length;
        for (el of matchesData){
            tempData.push(el)
        }
        matchesData = tempData;
        console.log(`Data succesfully refreshed! Added ${count} records!`)
        
    }else{
        console.log("Data is up to date!")
    }
     
}



async function initMatchesData(){

    lastRefreshTime = new Date();

    let tempData = [];
    let proccessed = 0;


    for (let start = 0; start<60; start+=19){
        proccessed = 0;
        await new Promise(res => setTimeout(res, 1000)); //Await for 1 sec cause of 20calls per sec limit

        response = await fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${myPUUID}/ids?start=${start}&count=19&api_key=${riotKey}`);
        if (response.status != 200){
            console.error("There was something wrong with finding matches of PUUID player");
            console.error(response);
            return;
        }
        const matches = await response.json();

        await new Promise( (resolve) => {
            Array.from(matches).forEach( async match => {
            
                response = await fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/${match}?api_key=${riotKey}`);
                if (response.status != 200){
                    console.error("Could not load data from game "+match);
                    console.error(response);
                    return;
                }
                response = await response.json();
                

                let players = response.metadata.participants
                let goodMatch = true;

                if (response.info.gameDuration < 600){
                    goodMatch = false;
                }else{
                    for (let p of team){
                        if (!players.includes(p)){
                            goodMatch = false;
                            break;
                        }
                    }

                }
                

                if (goodMatch){ 
                    matchNameList.push(response.metadata.matchId);
                    if (tempData.push(response) === 20){
                        resolve();
                    }
                }

                proccessed++
                if(proccessed == 19){
                    resolve();
                }

            })
            
        })
    }
    /////// Sort by the newest game
    matchesData = _.sortBy(tempData, (match) => match.info.gameStartTimestamp).reverse();
    console.log("Data succesfully initialized!")
}

/////////////////////////////////////////////////////////
//============ SEND MAILS =============
/////////////////////////////////////////////////////////
async function sendMail(who, mail, message){
    return new Promise(async (resolve, reject) => {

        let content = 
        `<h1> Message from ${who}</h1>
        <h2> Email for response: ${mail}</h2>
        <h4> Message:</h4>
        <p>${message}</p>
        `

        let config = {
            service: 'gmail',
            auth: {
                user: "mativlogerbusiness@gmail.com",
                pass: 'exbpatvpkoxxeggk'
            }
        }

        try{
            const transporter = nodeMailer.createTransport(config);

            const info = await transporter.sendMail({
                from: "Mati Vloger <mativlogerbusiness@gmail.com>",
                to: 'mbieniek396@gmail.com',
                subject: `You've got a new message from ${who}`,
                html: content
            })
            console.log(`New message send from : ${who}, messageInfo: ${info.messageId}`);
            resolve();
        }catch{
            reject();
        }

    });
    

}


app.set('view engine', 'ejs');

/// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


app.listen(8003, () =>{
    console.log("Server started, currently listening on http://localhost:8003");
    console.log(`Server started on ${new Date()}`);
    initMatchesData();
    loadSummonerSpellsObject();
    loadRunesObject();
    refreshLoop();
});


app.get('/', async (req, res) => {
    res.render('home');
});

app.get('/games', async (req, res) => {

    refreshMatchesData();

    res.render('games', {"matches" : matchesData});

    
});

app.get("/game/:id", (req,res) =>{


    res.render('game', {"match": matchesData[req.params.id], "summs" : summs, "runes": runes});

   
});


app.post('/sendContactMessage', (req, res) =>{
    let data = req.body
    sendMail(data.who, data.mail, data.message)
    .then(() => {
        res.status(200).send();
    });
})

app.get("/notFound", (req, res) => {
    res.render('notFound');
});


app.use((req, res) => {
    res.render('notFound');
})
