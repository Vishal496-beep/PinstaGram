import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: '20kb'}))
app.use(express.urlencoded({extended: true, limit: "20kb"}))
app.use(express.static("public"))

app.use(cookieParser())

//import routes
import userRouter from "./routes/user.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import videoRouter from "./routes/video.routes.js"
// Move this ABOVE the routes declaration
app.use((req, res, next) => {
    console.log(`Incoming: ${req.method} ${req.url}`);
    next();
});

//routes declaration
app.use("/api/v1/users", userRouter)
// Add this to app.js temporarily
app.use("/api/v1/video", videoRouter)
app.use("/api/v1/tweet", tweetRouter)


export { app }