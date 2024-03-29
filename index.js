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
const MIN_REFRESH_TIME = 2
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
let myPUUID = "C4k45DNQ3te6q3LCyLlvbNIIMVtDbvcJ0UekontTZigce3BAY6gmJOFfp3wt2zcgdPPO28odWlG8ZA";
let team = [];
let roleOrder = {"TOP": 1, "JUNGLE":2, "MIDDLE":3, "BOTTOM":4, "SUPPORT":5};


async function loadTeam(){
    let names = ["wh1t3xD", "ToN0", "Faillonis", "KAJXXX", "Mninja57"]
    for await (let name of names){
        let response = await fetch(`https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=RGAPI-f359733f-1ab4-403b-90c2-b2d5a3c67331`);
        if (response.status != 200){
            console.error(`Colud not find player named ${name}`);
            console.error(response);
            return;
        }
        response = await response.json();
        console.log(response);
        team.push(response.puuid);
    }
    myPUUID = team[0];
    console.log(team);
}

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

                    /// Fix UTILITY to SUPPORT
                    for(let pi of response.info.participants){
                        if (pi.teamPosition == "UTILITY"){
                            pi.teamPosition = "SUPPORT";
                        }
                    }

                    /// Sort participants
                    response.info.participants = _.sortBy(response.info.participants, 
                        (info) => roleOrder[info.teamPosition])

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

                    let me = response.info.participants.filter((p) => p.puuid === "4hMaaZ_gOQ3raaAYwIetAWMul0SykB9gNug5cz9h_3HDUuzZ32n2m_49nr3aThN3ro5llCDvwXiBFw")
                    response["win"] = me[0].win

                    if(goodMatch){
                        tempData.push(response)
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
        for (let match of matchesData){
            matchNameList.push(match.metadata.matchId);
        }
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

                /// Fix UTILITY to SUPPORT
                for(let pi of response.info.participants){
                    if (pi.teamPosition == "UTILITY"){
                        pi.teamPosition = "SUPPORT";
                    }
                }

                /// Sort participants
                response.info.participants = _.sortBy(response.info.participants, 
                    (info) => roleOrder[info.teamPosition])

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
                
                let me = response.info.participants.filter((p) => p.puuid === myPUUID)
                response["win"] = me[0].win

                if (goodMatch){ 
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
    for (let match of matchesData){
        matchNameList.push(match.metadata.matchId);
    }
    console.log("Data succesfully initialized!")
}

/////////////////////////////////////////////////////////
//============ SEND MAILS =============
/////////////////////////////////////////////////////////
async function sendMail(who, mail, message){
    return new Promise(async (resolve, reject) => {
        let content = 
        `<!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;">
            <h1 style="text-align: center;font-family: cursive;margin: 0;color: #000;background: #FFF;width: 100%;padding: 2rem 0;"> 
            You've go a new message!</h1>
            <h2 style="text-align: center;font-family: cursive;margin: 0;color: #FFF;background: #000;width: 100%;padding: 0.5rem 0;">
            From <span style="color: #F0592A">${who}<span></h2>
            <h2 style="text-align: center;font-family: cursive;margin: 0;color: #FFF;background: #000;width: 100%;padding: 0.5rem 0;">
            Email for response: <span style="color: #F0592A">${mail}<span></h2>
            <h4 style="text-align: center;font-family: cursive;margin: 0;color: #FFF;background: #F0592A;width: 100%;padding: 0.5rem 0;">
            Message:</h4>
            <div style="margin: 0;background: #FFF;
            border: 2px solid #F0592A;
            "><pre style="margin: auto;padding: 0.5rem;;max-width: 30ch;background: #dedede;color: #000;font-family: cursive;
            ">${message}</pre></div>
        </body>
        </html>        
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
                to: 'holdupnevus@gmail.com',
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
app.set("views", path.join(__dirname, "views"));


/// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


app.listen(8003, async () =>{
    console.log("Server started, currently listening on http://localhost:8003");
    console.log(`Server started on ${new Date()}`);
    await loadTeam();
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

    let index = matchNameList.indexOf(req.params.id);
    res.render('game', {"match": matchesData[index], "summs" : summs, "runes": runes});

   
});



app.post('/sendContactMessage', (req, res) =>{
    let data = req.body
    sendMail(data.who, data.mail, data.message)
    .then(() => {
        res.status(200).send();
    })
    .catch( () => {
        res.status(500).send();
        console.log("Messange was not send, bacause of internal error")
    });
})


app.use((req, res) => {
    res.render('notFound');
})
