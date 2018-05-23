var assert = require('assert');
var User = require('./User')
var Mongool = require('../index')
const { PerformanceObserver, performance } = require('perf_hooks');

//TODO: Implement proper tests

describe('Model',function(){
    User.connection = Mongool.connect()

    var currentuser = new User({
        username: "HelloWorld",
        password: "123456", 
        nationalities: ["australias"]
    })

    it('should create a model', function(){
        if(currentuser instanceof User){
            return true
        }
    })

    
    it('should connect', async function(){
        await User.CollectionConnection()
        return true
    })

    it('should validate', async function(){
        await currentuser.validate()
        return true
    })

    it('should save', async function(){
        await currentuser.save()
        return true
    })

    it('should remove', async function(){
        await currentuser.remove()
        return true
    })
})