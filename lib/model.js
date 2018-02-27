'use strict'

var MongoClient = require('mongodb').MongoClient
var Bluebird = require('bluebird')
var deepclone = require('clone-deep')
var Validator = require('./validator')

function ModelConfigurator(config){
    function Model(document, newDocument){
        /**
         * Private Variables
         */
        var promise = Bluebird.pending()
        promise.resolve(undefined)
        var chain = promise.promise

        var originalDocument = deepclone(document)
        var self = this
        newDocument = newDocument || document._id === undefined ? true : false

        /**
         * Public Variables
         */
        this.document = document
        this.clientCollection = clientCollection
        /**
         * Private functions
         */

        function build(document, schema){
            var promise = Bluebird.pending()

            return document

            promise.resolve(document)

            return promise.promise
        }

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

        this.save = function save(options){
            chain = chain
            .then(val => this.get())
            .then(function(document){
                self.document = setter(originalDocument, document, config.schema)
                newDocument = false
                if(self.document._id !== undefined){
                    return clientCollection.then(collection => collection.update({_id: self.document._id}, self.document))
                }else{
                    return clientCollection
                        .then(collection => collection.insertOne(self.document))
                        .then(insert => self.document._id = insert.insertedId)
                }
                originalDocument = deepclone(self.document)
            })
            return this
        }
    
        this.remove = function remove(){
            chain = chain.then(function(){
                if(self.document._id){
                    clientCollection.then(function(collection){
                        collection.remove({_id: self.document._id}, true)
                        delete self.document["_id"]
                    })
                }
            })
            return this
        }

        this.validate = function validate(){
            return new Validator(this.document, config.schema, Model)
        }
    
        this.get = function get(){
            return build(this.document, config.schema)
        }

        this.then = function then(func){
            chain = chain.then(func)
            return this
        }

        return this
    }
    
    var statics = {
        find: function find(query){
            return clientCollection
                .then(value => value.find(query).toArray())
                .then(function(arr){
                    var modelCollection = []
                    for(var document in arr){
                        modelCollection.push(new Model(arr[document]))
                    }

                    return modelCollection
                })
        },
        count: function count(query, options){
            return clientCollection
                .then(value => value.count(query, options))
        },
        findOne: function findOne(query){
            return clientCollection
                .then(value => value.find(query).toArray())
                .then(value => new Model(value[0]))
        }
    }
    
    var clientCollection = ConnectCollection(config)
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

module.exports = ModelConfigurator