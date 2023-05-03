const express = require('express');
const fetch = require('node-fetch');
const _ = require('lodash');
const path = require('path');

const app = express()


/////////////////////////////////////////////////////////
///////////// REFRESH SETTINGS //////////////////////////
/////////////////////////////////////////////////////////
const REFRESH_TIME_MINUTES = 4
const REFRESH_TIME_MILISECONDS = REFRESH_TIME_MINUTES*60000
const riotKey = "RGAPI-1bf767b8-39f6-42b6-90ed-a21cfd57b887";

/////////////////////////////////////////////////////////
///////////// GLOBAL THINGS TO USE //////////////////////
/////////////////////////////////////////////////////////
let lastRefreshTime = new Date(1683068581412);
var matchesData = [];
var summs = {};
let myPUUID = "4hMaaZ_gOQ3raaAYwIetAWMul0SykB9gNug5cz9h_3HDUuzZ32n2m_49nr3aThN3ro5llCDvwXiBFw";



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


async function refreshMatchesData(){

    
    /// TODO: Wywalać gry które mają mniej niż 10 min czasu trwania
    /// TODO: Brać tylko gry które graliśmy w 5

    

    if (new Date() - lastRefreshTime >= REFRESH_TIME_MILISECONDS){
        lastRefreshTime = new Date();


        response = await fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${myPUUID}/ids?start=0&count=20&api_key=${riotKey}`);
        if (response.status != 200){
            console.error("There was something wrong with finding matches of PUUID player");
            console.error(response);
            return;
        }
        const matches = await response.json();

        matchesData= [];
        await new Promise(res => setTimeout(res, 1000)); //Await for 1 sec cause of 20calls per sec limit
        await new Promise( (resolve) => {
            Array.from(matches).forEach( async match => {
                response = await fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/${match}?api_key=${riotKey}`);
                if (response.status != 200){
                    console.error("Could not load data from game "+match);
                    console.error(response);
                    return;
                }
                response = await response.json();
                
                if (matchesData.push(response) === 20){
                    resolve();
                }
            })
            
        })
        /////// Sort by the newest game
        matchesData = _.sortBy(matchesData, (match) => match.info.gameStartTimestamp).reverse();
        console.log("Data succesfully refreshed!")
        
    }else{
        console.log("Data is up to date!")
    }
    
        
}


app.set('view engine', 'ejs');

/// Middleware
app.use(express.static(path.join(__dirname, 'public')));


app.listen(8003, () =>{
    console.log("Server started, currently listening on http://localhost:8003");
    console.log("latest refresh time: "+lastRefreshTime);
    console.log(`From last update passed: ${new Date() - lastRefreshTime}ms`)
    console.log(`Today is ${new Date()}`)
    loadSummonerSpellsObject();
});


app.get('/', async (req, res) => {
    const response = await fetch(`https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-name/wh1t3xD?api_key=${riotKey}`)
    const summoner = await response.json();
    res.send(summoner)
});

app.get('/games', async (req, res) => {

    const error = await refreshMatchesData();


    if (error){
        res.redirect(`/notFound`)
    }else{
        res.render('games', {"matches" : matchesData, "summs" : summs});
    }
    
});

app.get("/game/:id", (req,res) =>{


    res.render('game', {"match": matchesData[req.params.id], "summs" : summs});

   
});

app.get("/notFound", (req, res) => {
    res.render('notFound');
});
