/**
 * Routes
 *
 * Use this file to add any module specific routes to the main Sails
 * route object.
 */


module.exports = {


  'get /opstool-donations-stewardwise/donor' : 
    'opstool-donations-stewardwise/DonorController.find',

  'get /opstool-donations-stewardwise/donor/similar' : 
    'opstool-donations-stewardwise/DonorController.findSimilar',

  'post /opstool-donations-stewardwise/donor' : 
    'opstool-donations-stewardwise/DonorController.save',

  'put /opstool-donations-stewardwise/donor/:donor_id' : 
    'opstool-donations-stewardwise/DonorController.save',


  'get /opstool-donations-stewardwise/donations' : 
    'opstool-donations-stewardwise/DonationsController.find',
  
  'post /opstool-donations-stewardwise/donations' : 
    'opstool-donations-stewardwise/DonationsController.save',
  
  'post /opstool-donations-stewardwise/donations/:donor_id' : 
    'opstool-donations-stewardwise/DonationsController.save'

};

