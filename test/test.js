'use strict'

/*var app = {}
var Citizen = require('./citizen')
var Car = require('./car')*/

var Citizen = require('./citizen')
var citizen = new Citizen({
    name: "Albert"
})

console.log(Citizen)
console.log(Citizen.findByName())
/*

var schema = {
    name: {
        type: String,
        required: true,

    },
    get password(){
        return this.password
    },
    set password(val){
        this.password = val + "hashed"
    }
}

class Model {
    constructor(document){
        this.originalKeys = {}
        this.collection = this.collection ? this.collection : this.constructor.name.toLowerCase()
    }

    
}

class User extends Model {

}


function validate(object, schema){
    return object
}

var doc = {
    name: "Albert",
    password: "12345678"
}
*/



//console.log("test" instanceof String)
//var mongol = require('../index')

/*
const MongoClient = require('mongodb').MongoClient

var docs = new MongoClient("mongodb://localhost/").connect()
    .then(function(client){
        var collection = client.db('test').collection('citizens')
        return collection
    })
    .then(collection => collection.find({}))
    .then(collection => collection.toArray())
    .then(function(docs){
        console.log(docs)
    })
    .catch(function(err){
        return err
    })

docs.then(function(docs){
    console.log(docs instanceof Error)
})

/*collection.find(function(err, docs){
    if(err) throw err
    console.log(docs)
})

var config = {
    server: 'localhost',
    db: 'test',
}

var models = {
    Citizen: Citizen(config),
    Car: Car(config)
}

app.models = models

console.log(models.Citizen)
models.Citizen.collection
    .then(collection => collection.find({}))
    .then(data => console.log(data))
//console.log(new models.Person({key1: 1}))

/*console.log(new model())
console.log(model)*/


/* var mongol = require('../index')()

var models = {
    person: require('./person')
}
var Person = models.person
console.log(Person)

var Citizen = new Person() *///*/