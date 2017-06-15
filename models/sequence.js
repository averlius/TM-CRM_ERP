"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * Article Schema
 */
var sequenceSchema = new Schema({
    _id: String,
    seq: { type: Number, default: 1 }
});



/**
 * Statics
 */
sequenceSchema.statics.inc = function(name, date, cb) {
    if (typeof date == "function") {
        cb = date;
        date = new Date();
    }

    this.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { upsert: true }, function(err, doc) {
        if (err)
            console.log(err);

        if (!doc)
            doc = { seq: 0 };

        return cb(date.getFullYear().toString().substr(2, 2) + numberFormat((date.getMonth() + 1), 2) + "-" + numberFormat(doc.seq, 6), doc.seq);
    });
};

sequenceSchema.statics.incNumber = function(name, length, cb) {
    this.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { upsert: true }, function(err, doc) {
        if (err)
            console.log(err);

        if (!doc)
            doc = { seq: 0 };

        return cb(numberFormat(doc.seq, length), doc.seq); // format PROV return 000440
    });
};

sequenceSchema.statics.incCpt = function(name, cb) {
    this.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { upsert: true }, function(err, doc) {
        if (err)
            console.log(err);

        if (!doc)
            doc = { seq: 0 };

        return cb(doc.seq); // format T return 440
    });
};

sequenceSchema.statics.incBarCode = function(name, length, cb) {
    this.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { upsert: true }, function(err, doc) {
        if (err)
            console.log(err);

        if (!doc)
            doc = { seq: 0 };

        return cb(name + numberFormat(doc.seq, length)); //P0120
    });
};

exports.Schema = mongoose.model('Sequence', sequenceSchema, 'Sequence');
exports.name = "Sequence";

var numberFormat = function(number, width) {
    //console.log("number : " + number);
    //console.log("width : " + width);
    //console.log(number + '');
    return new Array(width + 1 - (number + '').length).join('0') + number;
};