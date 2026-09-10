import mongoose from "mongoose";

async function DB_CONNECT() {
    const conn = await mongoose.connect(/** @type {string} */ (process.env.DB_URI));
    console.log("DB CONNECTED");
}

export default DB_CONNECT