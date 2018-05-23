'use strict'

var Model = require('./model')
var Validator = require('./validator')
var MongoClient = require('mongodb').MongoClient
var ObjectID = require('mongodb').ObjectID

//fix DeprecationWarning
ObjectID.prototype[require('util').inspect.custom] = ObjectID.prototype.toString

var mongol = {
    Model: Model,
    Validator: Validator,
    connect: async function connect(config){
        var config = config ? config : {}
        var url = "mongodb://" + (config.server ? config.server : "localhost") + (config.port ? ":" + config.port : "" )

        try{
            return await new MongoClient(url).connect()
        }catch(err){
            console.log("MONGOOL Connection Error:")
            throw err
        }
    }
}

module.exports = mongol