const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const path = require("path");
const dbpath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running perfect");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerObToRes = (playerObject) => {
  return {
    playerId: playerObject.player_id,
    playerName: playerObject.player_name,
  };
};

const getMatchIdResultObj = (matchIdObjet) => {
  return {
    matchId: matchIdObjet.match_id,
    match: matchIdObjet.match,
    year: matchIdObjet.year,
  };
};

const playerDetailsObj = (playerObj) => {
  return {
    playerId: playerObj.player_id,
    playerName: playerObj.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getQuery = `
         SELECT
            *
         FROM 
            player_details;
    `;
  const getResult = await db.all(getQuery);
  response.send(
    getResult.map((eachPlayer) => convertPlayerObToRes(eachPlayer))
  );
});

//get player id and name with help of player id

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `
         SELECT
            *
         FROM 
            player_details
        WHERE
           player_id = ${playerId};
    `;
  const getPlayer = await db.get(getQuery);
  response.send(convertPlayerObToRes(getPlayer));
});

//updating the player name based on player id

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const putQuery = `
        UPDATE
           player_details
        SET 
          player_name = '${playerName}'
        WHERE
           player_id = ${playerId};

    `;
  await db.run(putQuery);
  response.send("Player Details Updated");
});

// get match details from match_details table

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchIdQuery = `
        SELECT
           * 
        FROM 
          match_details
        WHERE
          match_id = ${matchId};
    `;
  const getMatchQuery = await db.get(getMatchIdQuery);
  response.send(getMatchIdResultObj(getMatchQuery));
});
module.exports = app;

//get match details based on playerId by natural join

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `
        SELECT 
           match_id,
           match,
           year
        FROM 
           match_details NATURAL JOIN player_match_score
        WHERE
           player_match_score.player_id = ${playerId};
    `;
  const matchRes = await db.all(getQuery);
  response.send(matchRes.map((eachMatch) => getMatchIdResultObj(eachMatch)));
});

//get player id name based on match id

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `
         SELECT 
            player_id,
            player_name
        FROM 
           player_details NATURAL JOIN player_match_score
        WHERE
           player_match_score.match_id = ${matchId};
    `;
  const playerRes = await db.all(getQuery);
  response.send(playerRes.map((eachPlayer) => playerDetailsObj(eachPlayer)));
});

//get statistic on player_details and player_match_score

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStaticsQuery = `
          SELECT 
             player_id AS playerId,
             player_name AS playerName,
             SUM(score) AS totalScore,
             SUM(fours) AS totalFours,
             SUM(sixes) AS totalSixes
        FROM 
           player_details NATURAL JOIN player_match_score
        WHERE
           player_details.player_id = ${playerId};
    `;
  const sumRes = await db.get(getStaticsQuery);
  response.send(sumRes);
});
