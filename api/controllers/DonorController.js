/**
 * DonorController
 *
 * @description :: Server-side logic for managing Donors
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var fs = require('fs');
var path = require('path');
var AD = require('ad-utils');


// for Hack-a-thon testing:
var fixtureData = null;


module.exports = {

    _config: {
        model: "donor", // all lowercase model name
        actions: true,
        shortcuts: true,
        rest: true
    },


    find:function(req,res) {

    	if (fixtureData == null) {

            var pathToFile = path.join(__dirname,'..', '..', 'test', 'fixtures', 'donor.json');
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

