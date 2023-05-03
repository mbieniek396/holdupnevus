const express = require('express');
const fetch = require('node-fetch');
const _ = require('lodash');


const app = express()


/////////////////////////////////////////////////////////
///////////// REFRESH SETTINGS //////////////////////////
/////////////////////////////////////////////////////////
const REFRESH_TIME_MINUTES = 4
const REFRESH_TIME_MILISECONDS = REFRESH_TIME_MINUTES*60000
const riotKey = "RGAPI-fd574f79-a3ab-443a-af4a-97eeeb72241e";

/////////////////////////////////////////////////////////
///////////// GLOBAL THINGS TO USE //////////////////////
/////////////////////////////////////////////////////////
var lastRefreshTime = new Date(1683068581412);
var matchesData = []



app.set('view engine', 'ejs');

/// Middleware
app.use(express.static('public'));


app.listen(8003, () =>{
    console.log("Server started, currently listening on http://localhost:8003");
    console.log("latest refresh time: "+lastRefreshTime);
    console.log(`From last update passed: ${new Date() - lastRefreshTime}ms`)
});


app.get('/', async (req, res) => {
    const response = await fetch(`https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-name/wh1t3xD?api_key=${riotKey}`)
    const summoner = await response.json();
    res.send(summoner)
});

app.get('/games', async (req, res) => {

    if (new Date() - lastRefreshTime >= REFRESH_TIME_MILISECONDS){
        lastRefreshTime = new Date();
        response = await fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/4hMaaZ_gOQ3raaAYwIetAWMul0SykB9gNug5cz9h_3HDUuzZ32n2m_49nr3aThN3ro5llCDvwXiBFw/ids?start=0&count=20&api_key=${riotKey}`);
        const matches = await response.json();

        matchesData = [];
        await new Promise(res => setTimeout(res, 1000)); //Await for 1 sec cause of 20calls per sec limit
        await new Promise( (resolve) => {
            Array.from(matches).forEach( async match => {
                response = await fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/${match}?api_key=${riotKey}`);
                response = await response.json();
                
                if (matchesData.push(response) === 20){
                    resolve();
                }
            })
            
        })
        /////// Sort by the newest game
        matchesData = _.sortBy(matchesData, (match) => match.info.gameStartTimestamp).reverse();
    }

    res.render('games', {"matches" : matchesData});
    
    
    
});
