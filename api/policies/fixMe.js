/**
 * fixMe
 * 
 * @module      :: Policy
 * @description :: Adds utility properties and methods to the `req` and 
 *                 `res` objects. For brevity and convenience.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */


var AD = require('ad-utils');

module.exports = function(req, res, next) {
  
    AD.log();
    AD.log('<red>!!!!!  Whoa!  This is such a bad idea!</red>');
    AD.log('<red>!!!!!  Make sure you secure this route [<yellow>'+req.url+'</yellow>] ! </red>');
    AD.log();
    next();

};
