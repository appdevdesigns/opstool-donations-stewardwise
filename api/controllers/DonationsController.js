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


    find:function(req,res) {

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

    }
	
};

