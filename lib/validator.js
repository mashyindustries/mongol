'use strict'

var deepclone = require('clone-deep')
var ObjectID = require('mongodb').ObjectID
var Bluebird = require('bluebird')
const isIp = require('is-ip')

module.exports = function(object, schema, model){
    return validate(object, schema, undefined, model).then(function(errors){
        return new Validator(errors)
    })
}

function Validator(validationErrors){
    var valid = Object.keys(validationErrors).length === 0

    this.errors = function errors(){
        return validationErrors
    }

    this.fails = function fails(){
        return valid ? false : true
    }

    return this
}

const isEmpty = (val) => val === '' || val === undefined || (Array.isArray(val) && val.length === 0) || JSON.stringify(val) === '{}';
function mergePromiseToErrors(promiseArray){
    return Promise.all(promiseArray).then(function(errorsArray){
        return errorsArray.reduce((obj, item) => {
          Object.assign(obj, item)
          return obj
        }, {})
    })
}

function validate(document, schema, dotnotation, model){
    var promises = []

    var dotnotation = dotnotation ? dotnotation : ""
    for(var item in schema){
        var level = dotnotation + item + "."
        var itemSchema = schema[item]
        setDefaultValue(document, item, itemSchema)
        promises.push(validateItem(document[item], item, schema[item], level, model))
    }
    for(var item in document){
        if(typeof schema[item] === "undefined"){
            promises.push({[dotnotation + item + ".unchecked"]: "This field is not in the schema"})
        }
    }
    return mergePromiseToErrors(promises)
}

function setDefaultValue(document, item, schema){
    var defaultvar = schema["default"]
    if(typeof document[item] === "undefined" && typeof defaultvar !== "undefined"){
        document[item] = defaultvar
    }
}

function validateItem(document, item, schema, level, model){
    var promises = []

    var requiredErrors = getRequiredErrors(document, item, schema, level)

    if(!isEmpty(requiredErrors)){
        promises.push(requiredErrors)
        return mergePromiseToErrors(promises)
    }
    if(typeof document !== "undefined"){
        promises.push(getUniqueErrors(document, item, schema, level, model))
        promises.push(getTypeErrors(document, item, schema, level, model))
        promises.push(getSubTypeErrors(document, item, schema, level))
        promises.push(isErrors(document, item, schema, level))
    }

    return mergePromiseToErrors(promises)
}

function getUniqueErrors(document, item, schema, level, model){
    if(schema.unique === true){
        return mergePromiseToErrors([(model.count({[level.slice(0, - 1)]: document})
            .then(function(count){
                if(count > 0) return {[level + "unique"]: "This field must be unique"}
                return {}
            })
        )])
    }
    return {}
}

function getTypeErrors(document, item, schema, level, model){
    var promises = []
    var errors = {}

    if(schema.array === true){
        if(document.constructor !== Array){
            errors[level + "array"] = "This field must be an array"
        }else{
            var arraySchema = deepclone(schema)
            delete arraySchema.array
            for(var arrayItem in document){
                var arrayLevel = level + arrayItem + "."
                promises.push(validateItem(document[arrayItem], arrayItem, arraySchema, arrayLevel, model))
            }
        }
    }else if(schema.type.constructor === Object && schema.array !== true){
        if(document.constructor === Object){
            promises.push(validate(document, schema.type, level))
        }else{
            errors[level + "object"] = "This field must be an object"
        }
    }else if(schema.type === "string" && typeof document !== "string"){
        errors[level + "string"] = "This field must be text"
    }else if(schema.type === "number" && typeof document !== "number"){
        errors[level + "number"] = "This field must be numeric"
    }else if(schema.type === "boolean" && typeof document !== "boolean"){
        errors[level + "boolean"] = "This field must be a boolean"
    }else if(schema.type === Date && !(document instanceof Date)){
        errors[level + "Date"] = "This field must be a Date"
    }else if(schema.type === ObjectID && !(document instanceof ObjectID)){
        errors[level + "ObjectID"] = "This field must be a ObjectID"
    }

    promises.push(errors)

    return mergePromiseToErrors(promises)
}

function getRequiredErrors(document, item, schema, level){
    var errors = {}

    var required = !!schema["required"]
    var presentRequired = !!schema["present"]

    var isValuePresent = typeof document !== "undefined"
    var isValueEmpty = isEmpty(document)

    if(required && isValueEmpty){
        errors[level + "required"] = "This field must not be empty"
    }else if(presentRequired && !isValuePresent){
        errors[level + "present"] = "This field must be present"
    }

    return errors
}

function getSubTypeErrors(document, item, schema, level){
    var errors = {}

    if(schema.type === "string" && schema.subtype !== undefined){
        switch (schema.subtype) {
            case "ip" && !isIp(document):
                errors[level + "ip"] = "This field must be an ip address"
                break;
            case "ipv4" && !isIp.v4(document):
                errors[level + "ip"] = "This field must be an ipv4 address"
                break;
            case "ipv6" && !isIp.v6(document):
                errors[level + "ip"] = "This field must be an ipv6 address"
                break;
            case "alphaDash" && !(/^[\w-]+$/.test(document)):
                errors[level + "alphaDash"] = "This field must be valid alpha dash"
                break;
            case "alphaNumeric" && !(/^[A-Za-z0-9]+$/.test(document)):
                errors[level + "alphaNumeric"] = "This field must be valid alpha numeric"
                break;
            case "alpha" && !(/^[A-Za-z]+$/.test(document)):
                errors[level + "alpha"] = "This field must be valid alpha"
                break;
        }
    }else if(schema.type === Date && typeof schema.date.constructor === Object){
        if(schema.date.before instanceof Date && !(document < schema.date.before)){
            errors[level + "date.before"] = "This field must be before" + schema.date.before
        }
        if(schema.date.after instanceof Date && !(document > schema.date.after)){
            errors[level + "date.after"] = "This field must be after" + schema.date.after
        }
    }

    if(schema.regex instanceof RegExp && !schema.regex.test(document)){
        errors[level + "regex"] = "This field must be valid in" + schema.regex
    }

    return errors
}

function sizeErrors(document, item, schema, level){
    var errors = {}

    if(typeof schema.size === "number"){
        if(document.constructor === Array && document.length !== schema.size){
            errors[level + "size"] = "This field must be " + schema.size + " items long."
        }else if(typeof document === "string" && document.length !== schema.size){
            errors[level + "size"] = "This field must be " + schema.size + " characters long"
        }else if(typeof document === "number" && document !== schema.size){
            errors[level + "size"] = "This field must be " + schema.size
        }
    }
    if(typeof schema.min === "number"){
        if(document.constructor === Array && document.length >= schema.size){
            errors[level + "size"] = "This field must be " + schema.size + " items long."
        }else if(typeof document === "string" && document.length >= schema.size){
            errors[level + "size"] = "This field must be " + schema.size + " characters long"
        }else if(typeof document === "number" && document >= schema.size){
            errors[level + "size"] = "This field must be " + schema.size
        }
    }
    if(typeof schema.max === "number"){
        if(document.constructor === Array && document.length <= schema.size){
            errors[level + "size"] = "This field must be " + schema.size + " items long."
        }else if(typeof document === "string" && document.length <= schema.size){
            errors[level + "size"] = "This field must be " + schema.size + " characters long"
        }else if(typeof document === "number" && document <= schema.size){
            errors[level + "size"] = "This field must be " + schema.size
        }
    }

    return errors
}

function isErrors(document, item, schema, level){
    var errors = {}

    if(schema.is !== undefined){
        if(schema.is.constructor === Array){
            var is = false

            for(var arrayIs in schema.is){
                if(arrayIs === schema.is) is = true
            }

            if(is === false){
                errors[level + 'is'] = "This field must be one of the correct values"
            }
        }else if(typeof schema.is === "function"){
            Object.assign(errors, schema.is(document, item, schema, level))
        }else if(document === schema.is){
            errors[level + 'is'] = "This field must be" + schema.is
        }
    }

    return errors
}

/*

modifiable document


default: value //--Done--//
required: bool | present: bool | nullable: bool //--Done--//
requiredif: function(value, document, schema, Model) //--after--//
types:
    "string" //--Done--//
    "number"//--Done--//
    type.Array//--Done--//
    {object type}//--Done--//
    boolean//--Done--//
    date//--Done--//
    objectId//--Done--//
specific subtypes:
    array:
        repeatable//--Done--//
    string:
        ip: bool//--Done--//
        ipv4: bool//--Done--//
        ipv6: bool//--Done--//
        alphaDash: bool//--Done--//
        alphaNumeric: bool//--Done--//
        alpha: bool//--Done--//
        email: bool//--Done--//
    date:
        before: Date//--Done--//
        after: Date//--Done--//
        beforeOrEqual: Date//--Done--//
        afterOrEqual: Date//--Done--//

is: value | [array of values] | function
unique: bool
size: value //--Done--//
min: value //--Done--//
max: value //--Done--//
regex: value //--Done--//
custom: array of functions or function. function(value, document, schema, Model)
unchecked: bool (default false) check last


//------
differentFrom: key(s)
with: key(s)
without: key(s)
same: key(s)
//------

*/