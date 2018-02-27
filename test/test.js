'use strict'

var Bluebird = require('bluebird')
var User = require('./user')

var user = new User({
    name: "1",
    security: {
        password: "hash",
    },
    username: 'mrmashyx',
    pertus: [{age: 1}, {}]
})

user.validate().then(function(validator){
    if(validator.fails()){
        console.log(validator.errors())
    }else{
        user.save().then(x => user.get()).then(document => console.log(document))
        user.remove()
    }
})