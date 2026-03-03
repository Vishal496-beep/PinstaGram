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
import commentRouter from "./routes/comment.routes.js"
import followRouter from "./routes/follow.routes.js"
import likeRouter from "./routes/likes.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import photoRouter from "./routes/photo.routes.js"
import healthChecker from "./routes/healthcheck.routes.js"
import searchRouter from "./routes/search.routes.js"

// Move this ABOVE the routes declaration
app.use((req, res, next) => {
    console.log(`Incoming: ${req.method} ${req.url}`);
    next();
});

//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/video", videoRouter)
app.use("/api/v1/tweet", tweetRouter)
app.use("/api/v1/comment", commentRouter)
app.use("/api/v1/follow", followRouter)
app.use("/api/v1/like", likeRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/photo", photoRouter)
app.use("/api/v1/healthcheck", healthChecker)
app.use("/api/v1/search", searchRouter)


export { app }