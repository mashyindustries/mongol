'use strict'

var Model = require('../index').Model
var Validator = require('../index').Validator
var ObjectID = require('mongodb').ObjectID

module.exports = new Model({
    db: "test",
    collection: 'users',
    statics: {
        findByName: function(){
            // do stuff
        }
    },
    schema: {
        "_id": {
            type: ObjectID
        },
        "name": {
            type: "string",
            required: true
        },
        "username": {
            type: "string",
            unique: true,
            required: true,
            max: 20
        },
        "security": {
            type: {
                "password": {
                    type: "string",
                    min: 6,
                    setter: function(value){
                        return value + "hashed"
                    },
                    required: true
                },
            }
        },
        "profile": {
            type: {
                "first-name": {
                    type: "string"
                },
                "last":{
                    type: "string"
                },
                "country-of-birth": {
                    type: "string"
                },
                "nationality": {
                    type: ["string"]
                },
                "height": {
                    type: "string"
                },
                "weight": {
                    type: "string"
                },
                "eye-colour": {
                    type: "string"
                },
                "gender": {
                    type: "string"
                },
                "blood-type": {
                    type: "string"
                },
                "hair-color": {
                    type: "string"
                },
                "skin-color": {
                    type: "string"
                },
                "religion": {
                    type: "string"
                },
                "date-of-birth": {
                    type: "date"
                },
            }
        },
        "pertus": {
            type: {
                "age": {
                    type: "number",
                    required: true,
                    default: 2
                },
                "_id": {
                    type: ObjectID
                }
            },
            array: true,
            present: true
        }
    }
})