const db = require('./db');
console.log("ENV USER:", process.env.DB_USER);
console.log("ENV PASS:", process.env.DB_PASSWORD);
async function testDB() {
    try {
        const [rows] = await db.query("SHOW TABLES");
        console.log("DB connected");
        console.log(rows);
    }catch (err){
        console.error("DB error:", err);
        
    }

}
testDB();