/// <reference path="./typings/main.d.ts" />
"use strict";
var express = require("express");
var dal = require("@nodulus/data");
var config = require("@nodulus/config").config;
var logs = require("@nodulus/config").logs;
//import {dal} from "@nodulus/data";
var ObjectID = require("mongodb").ObjectID;
var api = (function () {
    function api() {
    }
    //var dal = require('./dal.js');
    //var util = require('util');
    //var fs = require('fs');
    //var path = require('path');
    //var express = require('express');
    //var isObject = require('is-object');
    api.prototype.cleanEntityFramework = function (body, level) {
        if (body != null) {
            for (var key in body) {
                //                
                // if(isObject( body[key] ) && body[key].EntityKey !== undefined)
                // {
                //     //var o;
                //     //var refCollectionName = body[key].EntityKey.EntitySetName;
                //     //var _id = body[key].EntityKey.EntityKeyValues[0].Value;
                //     
                //     //body[key] = {
                //     //    "$ref" : refCollectionName,
                //     //    "$id" : _id
                //     //}
                //     
                // }
                // else
                // {
                if (key.indexOf("$") == 0 || key == "EntityKey") {
                    delete body[key];
                    continue;
                }
                //}
                if (Array.isArray(body[key])) {
                    for (var x = 0; x < body[key].length; x++) {
                        var subObj = body[key][x];
                        this.cleanEntityFramework(subObj, level++);
                    }
                }
                if (typeof (body[key]) == "object" && body[key] !== null) {
                    //&&  body[key].$ref === undefined
                    this.cleanEntityFramework(body[key], level++);
                }
            }
        }
    };
    api.prototype.getOperator = function (key) {
        var ops = {
            "$gt": ">"
        };
        if (ops[key] === undefined)
            return key;
        return ops[key];
    };
    api.prototype.start = function (app) {
        var router = express.Router();
        router.route('/*')
            .get(function (req, res) {
            var entity = req.params[0];
            var searchCommand = new SearchCommand();
            var specialCommand = new SpecialCommand();
            var aggregateCommand = new AggregateCommand();
            var sortCommand = {};
            var projection = {};
            for (var key in req.query) {
                if (key.indexOf("$") === 0) {
                    if (key === "$project")
                        aggregateCommand.$project = JSON.parse(req.query[key]);
                    else {
                        switch (key) {
                            case "$limit":
                                specialCommand.$limit = req.query[key];
                                break;
                            case "$skip":
                                specialCommand.$skip = req.query[key];
                                break;
                        }
                    }
                    if (searchCommand.$query === undefined)
                        searchCommand.$query = {};
                }
                else {
                    if (searchCommand.$query === undefined)
                        searchCommand.$query = {};
                    if (isNaN(req.query[key]))
                        searchCommand.$query[key] = req.query[key];
                    else
                        searchCommand.$query[key] = Number(req.query[key]);
                }
            }
            if (req.query.$search) {
                req.query.$search = JSON.parse(req.query.$search);
                if (req.query.$search.term !== "")
                    searchCommand.$query["$text"] = { $search: req.query.$search.term };
            }
            if (req.query.$sort)
                searchCommand.$orderby = JSON.parse(req.query.$sort);
            dal.get(entity, searchCommand, specialCommand, aggregateCommand, function (result) {
                res.json(result);
            });
            //dal.connect(function (err: any, db: any) {
            //    if (db === null) {
            //        return res.json(err);
            //    }
            //    db.collection(entity).ensureIndex(
            //        { "$**": "text" },
            //        { name: "TextIndex" }
            //    )
            //    if (specialCommand.$skip && specialCommand.$limit) {
            //        //get the item count
            //        db.collection(entity).find(searchCommand.$query).count(function (err: any, countResult: number) {
            //            db.collection(entity).find(searchCommand, aggregateCommand.$project).skip(Number(specialCommand.$skip)).limit(Number(specialCommand.$limit)).toArray(function (err: any, result: any) {
            //                var data = { items: result, count: countResult }
            //                res.json(data);
            //            });
            //        });
            //    } else {
            //        if (searchCommand.$query && searchCommand.$query["_id"]) {
            //            if (global.config.appSettings.database.mongodb.useObjectId) {
            //                searchCommand.$query["_id"] = ObjectID(searchCommand.$query["_id"]);
            //            }
            //        }
            //        db.collection(entity).find(searchCommand).toArray(function (err: any, result: any) {
            //            var data = { items: result !== null ? result : [], count: result !== null ? result.length : 0 }
            //            res.json(data);
            //        });
            //    }
            //})
        })
            .post(function (req, res) {
            if (!req.body)
                return res.sendStatus(400);
            var entity = req.params[0];
            var and = ",";
            var query = "INSERT INTO " + entity + " ";
            var body = req.body;
            if (body.data !== undefined)
                body = JSON.parse(body.data);
            if (body.length !== undefined) {
                for (var i = 0; i < body.length; i++) {
                    if (!config.appSettings.database.mongodb && config.appSettings.database.mongodb.useObjectId) {
                        //                searchCommand.$query["_id"] = ObjectID(searchCommand.$query["_id"]);
                        //            }
                        if (body[i].Id !== undefined) {
                            body[i]._id = body[i].Id;
                        }
                        else {
                            if (!body[i]._id || body[i]._id === null || body[i]._id === "")
                                body[i]._id = require("node-uuid").v4();
                        }
                    }
                    this.cleanEntityFramework(body[i], 0);
                    //if (body[i] != null) {
                    //    for (var key in body[i]) {
                    //        if (key.indexOf("$") == 0 || key == "EntityKey") {
                    //            delete body[i][key];
                    //            continue;
                    //        }
                    //        if (Array.isArray(body[i][key])) {
                    //            for (var x = 0; x < body[i][key].length; x++) {
                    //                var subObj = body[i][key][x];
                    //                for (var subkey in subObj) {
                    //                    if (subkey.indexOf("$") == 0 || subkey == "EntityKey") {
                    //                        delete subObj[subkey];
                    //                        continue;
                    //                    }
                    //                }
                    //            }
                    //        }
                    //        query += key + "=@" + key + and;
                    //    }
                    //}
                    dal.query(query, body[i], function (apiResult) {
                        var data = { items: apiResult.ops };
                        global["eventServer"].emit(entity + " UPDATE");
                        if (i == body.length)
                            res.end(JSON.stringify(data));
                    });
                }
            }
            else {
                if (config.appSettings.database.mongodb && !config.appSettings.database.mongodb.useObjectId) {
                    body._id = require("node-uuid").v4();
                }
                if (body != null) {
                    for (var key in body) {
                        query += key + "=@" + key + and;
                    }
                }
                dal.query(query, body, function (apiResult) {
                    var data = { items: apiResult.ops };
                    global["eventServer"].emit(entity + " UPDATE", data);
                    res.end(JSON.stringify(data));
                });
            }
        })
            .put(function (req, res) {
            if (!req.body)
                return res.sendStatus(400);
            var entity = req.params[0];
            var and = ",";
            var query = "UPDATE " + entity + " SET ";
            if (req.body != null) {
                for (var key in req.body) {
                    if (key !== "")
                        query += key + "=@" + key + and;
                }
            }
            query = query.substr(0, query.length - 1);
            query += ' WHERE _id' + "=@_id";
            dal.query(query, req.body, function (apiResult) {
                var data = { items: apiResult.ops };
                global["eventServer"].emit(entity + " UPDATE");
                res.end(JSON.stringify(data));
            });
        }).delete(function (req, res) {
            if (!req.body)
                return res.sendStatus(400);
            var entity = req.params[0];
            var and = " AND ";
            var query = "DELETE FROM " + entity + " WHERE ";
            if (req.query != null) {
                for (var key in req.query) {
                    if (key !== "")
                        query += key + "=@" + key + and;
                }
            }
            dal.query(query, req.query, function (apiResult) {
                var data = { items: apiResult.ops };
                res.end(JSON.stringify(data));
            });
        });
        app.use('/api', router);
    };
    return api;
}());
var SpecialCommand = (function () {
    function SpecialCommand() {
    }
    return SpecialCommand;
}());
var SearchCommand = (function () {
    function SearchCommand() {
    }
    return SearchCommand;
}());
var AggregateCommand = (function () {
    function AggregateCommand() {
    }
    return AggregateCommand;
}());
module.exports = new api();
