'use strict'

var MongoClient = require('mongodb').MongoClient
var Bluebird = require('bluebird')

function ModelConfigurator(config){
    function Model(document){
        //private variables
        //private methods
        
        //check if document
        //this.collection = this.collection || this.constructor.name.toLowerCase() + "s"
    
        var keys = keys || {}
        var originalKeys = keys
        var transformers = {}
        var document
    
        this.save = function save(){
            console.log(this.collection)
        }
    
        this.update = function update(){
            
        }
    
        this.deleteModel = function deleteModel(){
    
        }
    
        this.get = function get(){
    
        }
    
        this.getKey = function getKey(){
    
        }
    
        this.setKey = function setKey(){
            
        }
    
        this.deleteKey = function deleteKey(){
            
        }
    
        this.getAll = function getAll(){
            
        }
    
        this.get = function get(){
            return validate(this.document, schema)
        }
    
        function validate(object, schema){
            return object
        }
    
    
        return this
    }
    
    var statics = {
        //default statics here
    }
    
    Object.assign(statics, config.statics)
    Object.assign(Model, statics)
    Object.assign(Model, config)

    return Model
}

function ConnectCollection(config){
    if(config.db === undefined) throw Error("config.db undefined")
    if(config.collection === undefined) throw Error("config.collection undefined")

    var url = "mongodb://" + (config.server || "localhost") + (config.port ? ":" + config.port : "" )

    return new MongoClient(url)
        .connect()
        .then(client => client.db(config.db).collection(config.collection))
        .catch(function(err){
            console.log(err)
        })
}

function solveSchema(schema, document, mode){
    if(mode !== "get" || mode !== "set") throw Error('No Schema Mode Selected')
    for(objectKey in schema){
        if (typeof objectKey === Object){
            document[objectKey] = solveSchema(schema[objectKey.type], document[objectKey], mode)
            continue
        }
        if(mode == "get"){
            document[objectKey] = objectKey.get(document[objectKey])
            continue
        }
        if(mode == "set"){
            document[objectKey] = objectKey.set(document[objectKey])
            continue
        }
    }
    return document
}

module.exports = ModelConfigurator

/*
Objects that are objects must include object in type

object keys
===========
type: [String, Object, Array, Number, Boolean, Custom]
required
getter
setter
hidden = []
visible
fillable
default
guarded = []
strict(unchecked keys) default true
validation: {
    max:var (string, array, number, file)
    min:var (string, array, number, file)
    present
    regex
    requiredWith
    requiredWithAll
    requiredWithout
    requitedWithoutAll
    same
    requiredIf
    requiredUnless
    accepted
    sometimes
}
====
static
non-statics
transformers
connection vars
====
schemaKeys
constructor(){
    schemaKeys -> objectKeys
    seal
}
realKeys

save() -> objectKeys -> realKeys -> originalKeys
*/