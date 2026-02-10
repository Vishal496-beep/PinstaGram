# This is a backend of Pinstagram
    javaScript, mongoDB, Express, cloudinary are used


# we should always while working have to restart the file preview
[*Model link](https://stackblitz.com/edit/stackblitz-starters-ersmd6ug?file=models%2Ftodos%2Fsub_todo.models.js)

# backend ~

    Always use async/await or try catch approch in database because 'databse is in another continent'
# middleware simply means k like /instagram par click krne k baad jo b request gyi or response bhejna h uske beech ka difference like if user is loggedin or if a user is admin
(err, req, res, next) next jb bhi use kia h iska matlb h ki middleware ki baat hori h
# we use app.get app.post  but  app.use we are going to use when we want to configure or for middlewares
# higher order functions are jo function as a parameter b accept krte h or as a function bhi

# arrow fnction kbhi bhi this use nhi krta user.model mei isliye hmesha function use krns chhahiye


# app.use
     .use hmesha mostly jb bhi middleware inject krna hota h toh use hoga 

# access tokens~
     those tokens which expires shortly like 1 day 15min or so 
#  refresh tokens ~
     are those tokens which are longer . ex=> 1month , 1year

# user.controller.js ~
    here in login we are using user and User the difference is clear that User.findone or .findbyid can be accessed by only databse we havesaved

# req, _, next
    sometimes we see this instead of res#