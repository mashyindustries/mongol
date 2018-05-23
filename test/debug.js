/*var User = require('./User')
var Mongool = require('../index')

User.connection = Mongool.connect()

var currentuser = new User({
    username: "HelloWorld",
    password: "123456", 
    nationalities: ["australias"]
})


async function doStuff(){
    try {
        await currentuser.validate()
        console.log(currentuser.get())
        await currentuser.save()
        await currentuser.remove()
    } catch (err) {
        console.log(err) //usually validation errors
    }
    
}

doStuff()*/