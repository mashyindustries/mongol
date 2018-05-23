# Introduction

## Example

### User.js
```javascript
'use strict'

var Mongool = require('mongool')
var ObjectID = require('mongodb').ObjectID

var User = Mongool.Model()

User.db = "test"
User.collection = 'Users'
User.schema = {
    "_id": {
        type: ObjectID,
    },
    "username": {
        type: String,
        unique: true,
        required: true,
        max: 20
    },
    "password": {
        type: String,
        min: 6,
        setter: function(value){
            //HASH FUNCTION HERE
            return value
        },
        required: true
    },
}

module.exports = User
```

### App.js

```javascript
var User = require('./User')
var Mongool = require('mongool')

//...

var connection = Mongool.connect() //reuse connection for each model

User.connection = connection

var currentuser = new User({
    username: "HelloWorld",
    password: "123456"
})


async function doStuff(){
    console.log(currentuser.get()) // { username: 'HelloWorld', password: '123' }
    await currentuser.validate()
    await currentuser.save()
    await currentuser.remove()
}

doStuff()
```

##  Coming Soon
- Indexes
- Optimisations
- Mass Assignability
- Hidden Variables (for `.get()`'s)
- Better Getter/Setters
- Better Validation
- Better documentation
- .save only on changes

## Schema Rules
### Types
```javascript
// List of valid types
String
Number
ObjectID
Date
Boolean
[/*...*/]
{/*...*/}
```
### Stacking Schemas
```javascript
var schema = {
    "profile": {
        type: {
            "first-name": {
                type: String,
                max: 16
            }
            "last-name": {
                type: String,
                max: 16
            }
            "nationalities": {
                type: [{
                    type: String,
                    max: 30 //string max length
                }],
                max: 5 //array max length
            }
        }
    }
}

//valid document
{
    "profile":{
        "first-name": "James"
        "last-name": "Smith"
        "Nationalities": ["Australian", "British"]
    }
}

```

### Validation Rules
```javascript
{
    type: Type, //value must be one of the above types
    min: Number, //value must be this or above
    max: Number, //value must be this or below
    size: Number, //value must be exact
    required: Boolean, //value must not be empty if true. 
    //Empty means: '', [], {}, undefined
    present: Boolean, //value must be present if true
    //Present means: anything except undefined
    is: Array, //value must be any of the values in the array
    is: *, //value must equal exactly this
    after: Date, //value must be after a certain date
    before: Date, //value must be before a certain date
    regex: RegExp, //value must pass RegExp test
    alpha: Boolean, //value must be alpha /^[A-Za-z]+$/
    alphaNumeric: Boolean, //value must be alpha-numeric /^[A-Za-z0-9]+$/
    alphaDash: Boolean, //value must be alpha-dash /^[\w-]+$/
    custom: Function, //value determined by function, more below
    unique: Boolean, //value must not be in database
}

```
### Other Schema Rules

```javascript
{
    default: var //default var if value undefined
    custom: function(document, item, schema, level, model){
        var errors = {}

        //...

        return errors
    }
}

```

## Model Functions
### Statics
```javascript
var count = await User.count(query)
var user = await User.findOne(query)
var connection = await User.CollectionConnection()
var users = await User.find(query)
```
### State
```javascript
var user = new User()

user.get()
await user.validate()
await user.save()
await user.remove()

```

### Custom Statics
```javascript
User.findByUsername = async function findByUsername(username){
    return await this.findOne({"username": username})
}
```