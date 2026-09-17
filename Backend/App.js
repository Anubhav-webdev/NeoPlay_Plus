import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()
app.use(cors(
     {
          origin: process.env.CORS_ORIGIN
     }
))

app.use(express.json({limit: "500kb"}))
app.use(express.urlencoded({extended:true, limit: "10mb"}))
app.use(express.static("public"))

app.use(cookieParser())

export {app}