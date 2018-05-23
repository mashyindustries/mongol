'use strict'

var Mongool = require('../index')
var ObjectID = require('mongodb').ObjectID

var User = Mongool.Model()

User.db = "test"
User.collection = 'Users'
User.schema = {
    "_id": {
        type: ObjectID,
        index: true
    },
    "username": {
        type: String,
        unique: true,
        required: true,
        index: true,
        max: 20
    },
    "password": {
        type: String,
        min: 6,
        setter: function(value){
            return 'hash'
        },
        required: true
    },
    "nationalities": {
        type: [{
            type: String,
            max: 30
        }]
    }
}

module.exports = User