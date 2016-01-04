/**
 * DonationsController
 *
 * @description :: Server-side logic for managing Donations
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var fs = require('fs');
var path = require('path');
var AD = require('ad-utils');


// for Hack-a-thon testing:
var fixtureData = null;


module.exports = {

    _config: {
        model: "donation", // all lowercase model name
        actions: true,
        shortcuts: true,
        rest: true
    },

    
    /**
     * Finds all donations to the current staff user.
     */
    find: function(req, res) {
        var donorID = req.param('donor_id') || 0;
        var nssrenID = req.stewardwise.nssren.nssren_id;
        
        LNSSDonItem.byDonor(nssrenID, donorID)
        .fail(function(err) {
            res.AD.error(err);
        })
        .then(function(list) {
            res.AD.success(list);
        });
    
    },
    
    findFixtures: function(req, res) {

    	if (fixtureData == null) {

            var pathToFile = path.join(__dirname,'..', '..', 'test', 'fixtures', 'donation.json');
	    	fs.readFile(pathToFile, { encoding:'utf8'}, function(err, data) {

	    		if (err) {
	    			res.serverError(err);
	    		} else {

	    			fixtureData = JSON.parse(data);
	    			res.json(fixtureData);
	    		}
	    	})

	    } else {
	    	res.json(fixtureData);
	    }

    },
    
    /**
     * POST /opstool-donations-stewardwise/donations/:donor_id
     *
     * Saves a donation item from a donor to the current staff user.
     *
     * The donation item will be added to the newest pending donation batch.
     * If no pending batch is available, a new one will be created.
     */
    save: function(req, res) {
        var nssrenID = req.stewardwise.nssren.nssren_id;
        var fee = 0.05; // default assessment fee %
        
        var donorID = req.param('donor_id') || 0;
        var itemDate = req.param('donItem_dateReceived') || new Date();
        var itemAmount = req.param('donItem_amount') || 0;
        var itemDesc = req.param('donItem_description') || '';
        var itemType = req.param('donItem_type') || 1;
        
        // Map long form item type back to its numeric key
        var typeMap = {
            // One-time
            1: [ 1, 'one', 'one-time', 'once' ],
            // Monthly
            2: [ 2, 'monthly' ],
        };
        for (var key in typeMap) {
            var typeText = String(itemType).toLowerCase();
            if (typeMap[key].indexOf( typeText ) != -1) {
                itemType = key;
                break;
            }
        }
        
        var batchID = null;
        var results = {};
        
        async.series([
            function(next) {
                LNSSDonItem.query("SET NAMES latin1", function(err, results) {
                    if (err) next(err);
                    else next();
                });
            },
            
            // Look up assessment fee %
            function(next) {
                LNSSDonBatch.query(" \
                    SELECT config_value \
                    FROM nss_core_config \
                    WHERE config_name = 'adminFee' \
                    LIMIT 1 \
                ", function(err, results) {
                    if (err) next(err);
                    else  if (results && results[0]) {
                        fee = results[0].config_value;
                        next();
                    }
                });
            },
            
            // Look for newest pending batch
            function(next) {
                LNSSDonBatch.find()
                .where({ 
                    nssren_id: nssrenID,
                    donBatch_status: 'Pending'
                })
                .sort('donBatch_dateCreated DESC')
                .limit(1)
                .exec(function(err, list) {
                    if (err) next(err);
                    else if (list && list[0]) {
                        batchID = list[0].donBatch_id;
                    }
                    next();
                });
            },
            
            // Create new batch if needed
            function(next) {
                if (batchID > 0) {
                    // Pending batch already exists
                    next();
                }
                else {
                    LNSSDonBatch.create({
                        nssren_id: nssrenID,
                        donBatch_dateCreated: new Date(),
                        donBatch_status: 'Pending'
                    })
                    .exec(function(err, data) {
                        if (err) next(err);
                        else {
                            batchID = data.donBatch_id;
                            next();
                        }
                    });
                }
            },
            
            // Create donation item
            function(next) {
                LNSSDonItem.create({
                    donBatch_id: batchID,
                    donor_id: donorID,
                    donItem_dateReceived: itemDate,
                    donItem_amount: itemAmount,
                    donItem_description: itemDesc,
                    donItem_type: itemType
                })
                .exec(function(err, data) {
                    if (err) next(err);
                    else {
                        results = data;
                        next();
                    }
                });
            },
            
            // Update batch totals
            function(next) {
                // Use direct SQL to increment the batch totals.
                // This way there is no need to find() the totals separately
                // first, and it avoids concurrency problems if two donations
                // are added simultaneously.
                LNSSDonBatch.query(" \
                    UPDATE nss_don_donBatch \
                    SET \
                        donBatch_amount = donBatch_amount + ?, \
                        donBatch_fee = donBatch_fee + ? \
                    WHERE donBatch_id = ? \
                ", [
                    Number(itemAmount).toFixed(2),
                    Number(itemAmount * fee).toFixed(2),
                    batchID
                ], function(err, results) {
                    if (err) next(err);
                    else next();
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
	
};

