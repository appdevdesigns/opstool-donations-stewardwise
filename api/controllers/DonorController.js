/**
 * DonorController
 *
 * @description :: Server-side logic for managing Donors
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var fs = require('fs');
var path = require('path');
var AD = require('ad-utils');


module.exports = {

    _config: {
        model: "donor", // all lowercase model name
        actions: true,
        shortcuts: true,
        rest: true
    },


    find:function(req, res) {
        
        var nssrenID = req.stewardwise.nssren.nssren_id;
        
        async.series([
            function(next) {
                // In StewardWise, some of the Chinese names are originally
                // encoded in UTF8 but stored using Latin1. They have to
                // be retrieved with Latin1.
                LNSSDonorRelations.query("SET NAMES latin1", function(err) {
                    if (err) next(err);
                    else next();
                });
            },
            
            function(next) {
                LNSSDonorRelations.find()
                .where({ nssren_id: nssrenID })
                .where({ donors_isActive: 1 })
                .populate('donor_id')
                .sort('donor_id')
                .fail(function(err){
                    res.AD.error(err);
                    next();
                })
                .then(function(list){
                    
                    var results = [];
                    list.forEach(function(relation) {
                        var donor = relation.donor_id;
                        results.push( donor );
                    });
                    
                    res.AD.success(results);
                    next();
                });
            },
            
            function(next) {
                // Return to UTF8
                LNSSDonorRelations.query("SET NAMES utf8", function(err) {
                    if (err) next(err);
                    else next();
                });
            }
        ], function(err) {
            if (err) console.log(err);
        });
        
    }
	
};

