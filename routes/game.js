const express = require('express');
const router = express.Router()
const db = require('../model/db')
const pool = db.pool
var randomWords = require('random-words');
const app=express()
app.use(express.json())

router.post('/', async (req,res)=>{
    let newGame;
    if(req.body.newGame == "true"){newGame=true;}
    else{newGame=false;}
    try{
        const client = await pool.connect();
        if(newGame){
            const randWord = randomWords();
            let len = randWord.length;
            let hiddenWord = '*'.repeat(len);
            try {
                let qResult = await client.query(`INSERT INTO hangmantb (hidden_word, word, guesses, mistakes) VALUES ($1, $2, $3, $4) RETURNING *`, [hiddenWord,randWord,0,0])
                client.release()
                const results = qResult.rows[0]
                res.render('../views/game.ejs',{'results':results})
            } catch (err) {
                console.error(err)
                res.send("error")
            }
        }
        else{
            const game_id = req.body.game_id
            const guess = req.body.guess
            try{
                let qResult = await client.query(`SELECT * from hangmantb WHERE game_id =$1`,[game_id])
                const info = qResult.rows[0]
                const guesses = info.guesses+1;
                let word = info.word;
                let hiddenWord = info.hidden_word
                if(word.includes(guess)){
                    for(i=0; i<word.length;i++){
                        if(word.charAt(i)==guess){
                            hiddenWord = setCharAt(hiddenWord,i,guess);
                        }
                    }
                    try{
                        qResult = await client.query(`UPDATE hangmantb SET hidden_word=$1, guesses =$2 WHERE game_id=$3 RETURNING *`,[hiddenWord,guesses,game_id])
                        if(hiddenWord==word){
                            const endInfo = {
                                'win': false,
                                'word': word
                            }
                            client.release()
                            res.render('../views/gameover.ejs',{'endInfo':endInfo});
                        }
                        else{
                            const results = qResult.rows[0]
                            client.release()
                            res.render('../views/game.ejs',{'results':results})
                        }
                    }
                    catch(err){
                        console.error(err)
                        res.send("error: could not update")
                    }
                }
                else{
                    const mistakes = info.mistakes+1
                    try{
                        qResult = await client.query(`UPDATE hangmantb SET mistakes=$1 WHERE game_id=$2 RETURNING *`,[mistakes,game_id])
                        if(mistakes > 7){
                            const endInfo = {
                                'win': false,
                                'word': word
                            }
                            client.release()
                            res.render('../views/gameover.ejs',{'endInfo':endInfo});
                        }
                        else{
                            const results = qResult.rows[0]
                            client.release()
                            res.render('../views/game.ejs',{'results':results})
                        }
                    }
                    catch(err){
                        console.error(err)
                        res.send("error: could not update")
                    }
                }
            }
            catch(err){
                console.error(err)
                res.send("error: could not query")
            }
        }
    }
    catch(err){
        console.error(err)
        res.send("err")
    }
})

router.get('/:id', async (req,res)=>{
    try{
        const client = await pool.connect();
        let qResult = await client.query(`SELECT * FROM hangmantb WHERE game_id=$1`, [req.params.id])
        if(qResult.rows.length>0){
            const results = qResult.rows[0]
            client.release()
            res.render('../views/game.ejs',{'results':results})
        }
        else{
            client.release()
            res.render('../views/gamenotfound.ejs')
        }
    }
    catch(err){
        console.error(err)
        res.send("could not redirect")
    }
})

function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substring(0,index) + chr + str.substring(index+1);
}

module.exports = router;