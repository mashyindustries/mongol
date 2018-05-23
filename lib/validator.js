'use strict'

var deepclone = require('clone-deep')
var ObjectID = require('mongodb').ObjectID
var Bluebird = require('bluebird')

module.exports = async function(object, schema, model){
    var errors = await validate(object, schema, undefined, model)
    var valid = Object.keys(errors).length === 0
    if(!valid){
        throw errors
    }
    return errors
}

const isEmpty = (val) => val === '' || val === undefined || (Array.isArray(val) && val.length === 0) || JSON.stringify(val) === '{}';

async function mergePromiseToErrors(promiseArray){
    var errorsArray = await Promise.all(promiseArray)
    return Object.assign({}, ...errorsArray)
}

async function validate(document, schema, dotnotation, model){
    var promises = []
    var dotnotation = dotnotation ? dotnotation : ""
    for(var item in schema){
        var level = dotnotation + item + "."
        setDefaultValue(document, item, schema[item])
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

async function validateItem(document, item, schema, level, model){
    var promises = []

    var requiredErrors = await getRequiredErrors(document, item, schema, level)
    
    if(!isEmpty(requiredErrors)){
        return requiredErrors
    }
    if(typeof document !== "undefined"){
        promises.push(getUniqueErrors(document, item, schema, level, model))
        promises.push(getTypeErrors(document, item, schema, level, model))
        promises.push(getSubTypeErrors(document, item, schema, level))
        promises.push(isErrors(document, item, schema, level))
        promises.push(getSizeErrors(document, item, schema, level))
        promises.push(getCustomErrors(document, item, schema, level, model))
    }

    return mergePromiseToErrors(promises)
}

async function getUniqueErrors(document, item, schema, level, model){
    if(schema.unique === true){
        var count = await model.count({[level.slice(0, - 1)]: document})
        if(count > 0) return {[level + "unique"]: "This field must be unique"}
    }
    return {}
}

async function getTypeErrors(document, item, schema, level, model){
    var promises = []
    var errors = {}
    if(schema.type.constructor === Array) {
        if(document.constructor !== Array){
            errors[level + "array"] = "This field must be an array"
        }else{
            for(var arrayItem in document){
                var arrayLevel = level + "[" + arrayItem + "]" + "."
                Object.assign(errors, await validateItem(document[arrayItem], arrayItem, schema.type[0], arrayLevel, model))
            }
        }
    }else if(schema.type.constructor === Object && schema.array !== true) {
        if(document.constructor === Object){
            Object.assign(errors, await validate(document, schema.type, level))
        }else{
            errors[level + "object"] = "This field must be an object"
        }
    }else if(schema.type === String && typeof document !== "string") {
        errors[level + "string"] = "This field must be text"
    }else if(schema.type === Number && typeof document !== "number") {
        errors[level + "number"] = "This field must be numeric"
    }else if(schema.type === Boolean && typeof document !== "boolean") {
        errors[level + "boolean"] = "This field must be a boolean"
    }else if(schema.type === Date && !(document instanceof Date)) {
        errors[level + "Date"] = "This field must be a Date"
    }else if(schema.type === ObjectID && !(document instanceof ObjectID)) {
        errors[level + "ObjectID"] = "This field must be a ObjectID"
    }
    promises.push(errors)
    return await mergePromiseToErrors(promises)
}

function getSubTypeErrors(document, item, schema, level){
    var errors = {}

    if(schema.alphaDash && !(/^[\w-]+$/.test(document))){
        errors[level + "alphaDash"] = "This field must be alpha dash"
    }
    if(schema.alphaNumeric && !(/^[A-Za-z0-9]+$/.test(document))){
        errors[level + "alphaNumeric"] = "This field must be alpha numeric"
    }
    if(schema.alpha && !(/^[A-Za-z]+$/.test(document))){
        errors[level + "alpha"] = "This field must be alpha"
    }
    if(schema.type === Date && typeof schema.date.constructor === Object){
        if((schema.date.before instanceof Date) && !(document < schema.date.before)){
            errors[level + "date.before"] = "This field must be before" + schema.date.before
        }
        if((schema.date.after instanceof Date) && !(document > schema.date.after)){
            errors[level + "date.after"] = "This field must be after" + schema.date.after
        }
    }
    if((schema.regex instanceof RegExp) && (!schema.regex.test(document))){
        errors[level + "regex"] = "This field must be valid in" + schema.regex
    }
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

function getSizeErrors(document, item, schema, level){
    var errors = {}
    if(typeof schema.size === "number"){
        if(document.constructor === Array && document.length !== schema.size){
            errors[level + "size"] = "This field must be  " + schema.size + " items long"
        }else if(typeof document === "string" && document.length !== schema.size){
            errors[level + "size"] = "This field must be " + schema.size + " characters long"
        }else if(typeof document === "number" && document !== schema.size){
            errors[level + "size"] = "This field must be " + schema.size
        }
    }
    if(typeof schema.min === "number"){
        if(document.constructor === Array && !(document.length >= schema.min) ){
            errors[level + "min"] = "This field must be " + schema.min + " items long or more"
        }else if(typeof document === "string" && !(document.length >= schema.min)){
            errors[level + "min"] = "This field must be " + schema.min + " characters long or more"
        }else if(typeof document === "number" && !(document.length >= schema.min)){
            errors[level + "min"] = "This field must be " + schema.min
        }
    }
    if(typeof schema.max === "number"){
        
        if(document.constructor === Array && !(document.length <= schema.max)){
            errors[level + "max"] = "This field must be  " + schema.max + " items long or less"
        }else if(typeof document === "string" && !(document.length <= schema.max)){
            errors[level + "max"] = "This field must be  " + schema.max + " characters long or less"
        }else if(typeof document === "number" && !(document.length <= schema.max)){
            errors[level + "max"] = "This field must be " + schema.max + " or less"
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
        }else if(document === schema.is){
            errors[level + 'is'] = "This field must be" + schema.is
        }
    }

    return errors
}

async function getCustomErrors(document, item, schema, level, model){
    var errors = {}

    if(schema.custom !== undefined){
        if(schema.custom.constructor === Array){
            for(var customFunction in schema.custom){
                Object.assign(errors, schema.custom[customFunction](document, item, schema, level, model))
            }
        }else if(schema.custom.constructor === Function){
            Object.assign(errors, schema.custom(document, item, schema, level, model))
        }
    }

    return errors
}