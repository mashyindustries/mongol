'use strict'

var Bluebird = require('bluebird')
var deepclone = require('clone-deep')
var Validator = require('./validator')
var ObjectID = require('mongodb').ObjectID

function ModelConfigurator(){
    function Model(document, newDocument){
        /**
         * Private Variables
         */
        var originalDocument = deepclone(document)
        newDocument = newDocument ? true : false

        /**
         * Public Variables
         */

        this.document = document

        /**
         * Private functions
         */

        function setter(old, current, schema){
            var setdoc = {}

            for(var item in current){
                var schemaSetter = schema[item] === undefined ? undefined : schema[item]["setter"]
                var type = schema[item] === undefined ? undefined : schema[item]["type"]
                if(typeof type === "object" && typeof current[item] === "object" && !Array.isArray(current[item])){
                    setdoc[item] = setter(old[item], current[item], type)
                }else if((typeof schemaSetter === 'function') && (newDocument || (current[item] === old[item]))){
                    setdoc[item] = schemaSetter(current[item])
                }else if(typeof current[item] !== "undefined") {
                    setdoc[item] = current[item]
                }
            }

            return setdoc
        }

        this.save = async function save(){
            this.document = setter(originalDocument, await this.get(), Model.schema)
            var collection = await Model.CollectionConnection()
            if(this.document._id){
                await collection.update({_id: this.document._id}, this.document, {upsert: true})
            }else{
                var insert = await collection.insertOne(this.document)
                this.document._id = insert.insertedId
            }
            originalDocument = deepclone(this.document)
        }
    
        this.remove = async function remove(){
            if(this.document._id){
                var collection = await Model.CollectionConnection()
                await collection.remove({_id: this.document._id}, true)
                delete this.document["_id"]
            }
        }

        this.validate = function validate(){
            return Validator(this.document, Model.schema, Model)
        }
    
        this.get = function get(){
            return this.document
        }

        return this
    }
    
    Model.find = async function find(query){
        var collection = await Model.CollectionConnection()
        var array = await collection.find(query).toArray()
        var modelCollection = []
        for(var document in arr){
            modelCollection.push(new Model(arr[document], false))
        }

        return modelCollection
    }
    Model.count = async function count(query, options){
        var collection = await Model.CollectionConnection()
        return await collection.count(query, options)
    }
    Model.findOne = async function findOne(query){
        var collection = await Model.CollectionConnection()
        return new Model(await collection.findOne(query), false)
    }
    Model.CollectionConnection = async function CollectionConnection(){
        if(Model.connection === undefined) throw Error("config.connection undefined")
        if(Model.db === undefined) throw Error("config.db undefined")
        if(Model.collection === undefined) throw Error("config.collection undefined")
        
        try {
            var client = await Model.connection
            return client.db(Model.db).collection(Model.collection)
        } catch (err) {
            console.log("MONGOOL Connection Error:")
            throw err
        }
    }

    return Model
}

module.exports = ModelConfigurator