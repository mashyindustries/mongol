'use strict'

var Model = require('../index').Model
var Validator = require('../index').Validator

module.exports = new Model({
    collection: 'citizens',
    statics: {
        findByName: function(){
            return this.collection
        }
    },
    schema: {
        "username": Validator({
            "type": String,
            "required": true,
            "max": 60
        }),
        "security": {
            
            "password": Validator({
                "type": String,
                "min": 6
            }),
        },
        "type": String,
        "name": {
            "first": String,
            "last": String
        },
        "profile": {
            "country-of-birth": String,
            "nationality": [[String], Validator({
                "required": true,
                "max": 60
            })],
            "height": String,
            "weight": String,
            "eye-colour": String,
            "gender": String,
            "blood-type": String,
            "hair-color": String,
            "skin-color": String,
            "religion": String,
            "date-of-birth": Date
        },
        "citizenship": String
    }
})