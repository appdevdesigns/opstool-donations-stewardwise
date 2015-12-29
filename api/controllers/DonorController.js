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
    
    
    /**
     * Find donors with similar details to the provided information
     */
    findSimilar: function(req, res) {
        
        var fieldGroups = [
            [ 'donors_lastName', 'donors_firstName' ],
            [ 'donors_chineseName' ],
            [ 'donors_address', 'donors_city' ],
            [ 'donors_homePhone' ],
            [ 'donors_cellPhone' ],
            [ 'donors_email' ]
        ];
        var dataGroups = [];
        
        // Check for req params that match any of the above fieldGroups
        for (var i=0; i<fieldGroups.length; i++) {
            var data = {};
            var count = 0;
            for (var j=0; j<fieldGroups[i].length; j++) {
                var field = fieldGroups[i][j];
                var value = req.param(field);
                if (value) {
                    data[field] = value.trim();
                    count++;
                }
            }
            if (count == fieldGroups[i].length) {
                dataGroups.push(data);
            }
        }
        
        // Special case: check if given donor name matches a spouse name
        if (req.param('donors_firstName')) {
            dataGroups.push({
                donors_spouseFirstName: req.param('donors_firstName'),
                donors_spouseLastName: req.param('donors_lastName')
            });
        }
        
        if (dataGroups.length == 0) {
            // No usable fields 
            res.AD.success([]);
        }
        else {
            var results = [];
            async.series([
                function(next) {
                    LNSSDonors.query("SET NAMES latin1", function(err) {
                        console.log('latin1');
                        if (err) next(err);
                        else next();
                    });
                },
                function(next) {
                    LNSSDonors.find()
                    .where({ or: dataGroups })
                    .fail(next)
                    .then(function(list) {
                        console.log(list);
                        results = list;
                        next();
                    });
                }
            ], function(err) {
                if (err) {
                    res.AD.error(err);
                } else {
                    res.AD.success(results);
                }
            });
            
        }
        
    },
    
    
    /**
     * Find all active donors related to the current staff user.
     */
    find: function(req, res) {
        
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
                    next(err);
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
            }
        ], function(err) {
            if (err) {
                console.log(err);
                res.AD.error(err);
            }
        });
        
    },
    
    
    // Create or Update, depending on whether donor_id is provided.
    //
    // Donor relation with the current staff user will be created for 
    // new donor entries.
    // 
    // If only the donor_id is provided with no other data, a donor relation
    // will be created.
    save: function(req, res) {
        // Part 1: Donor entry
        var data = {};
        for (var field in LNSSDonors.attributes) {
            var value = req.param(field);
            if (value) {
                data[field] = value;
            }
        }
        
        var donorID = null;
        var isNewEntry = false;
        if (data.donor_id) {
            donorID = data.donor_id;
            delete data.donor_id;
        } else {
            isNewEntry = true;
        }
        
        var dfd;
        if (isNewEntry) {
            // Create new entry
            dfd = LNSSDonors.create(data);
        } 
        else if (Object.keys(data).length == 0) {
            // Only the donor_id was given. So create new donor relation 
            // but don't modify donor details.
            // Instead, we read the donor data and send it so the client can
            // make a full model instance from it.
            dfd = LNSSDonors.findOne({ donor_id: donorID });
        }
        else {
            // Update existing donor entry
            dfd = LNSSDonors.update(data).where({ donor_id: donorID });
        }
        
        dfd.fail(function(err) {
            res.AD.error(err);
        });
        
        dfd.then(function(result) {
            res.AD.success(result);
            
            // Part 2: Donor relation entry
            var nssrenID = req.stewardwise.nssren.nssren_id;
            var donorID = result.donor_id;
            // Look for existing relation
            LNSSDonorRelations.find()
            .where({ 
                donor_id: donorID,
                nssren_id: nssrenID
            })
            .then(function(list) {
                if (list && list.length > 0) {
                    if (!list[0].donors_isActive) {
                        // Relation exists but is not active.
                        // Set as active now.
                        LNSSDonorRelations.update({
                            donor_isActive: 1
                        })
                        .where({
                            donorrelation_id: list[0].donorrelation_id
                        })
                        .then(function() {
                            // do nothing else
                        });
                    }
                }
                else {
                    // Relation does not exist yet.
                    // Create now.
                    LNSSDonorRelations.create({
                        donor_id: donorID,
                        nssren_id: nssrenID,
                        donors_isActive: 1
                    })
                    .then(function() {
                        // do nothing else
                    });
                }
            });
            
        });
        
    }
	
};

