const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobs');
const  auth  = require('../middleware/auth');

console.log('auth middleware:', auth); 
//console.log('jobsController:', jobsController);
// Get all job listings
router.get('/', auth, jobsController.index);

// Display form to add a new job listing
router.get('/new', auth, jobsController.newJob);

// Get a specific job to edit
router.get('/edit/:id', auth, jobsController.editJob);

// Handle job creation
router.post('/', auth, jobsController.createJob);

// Handle job update
router.post('/update/:id', auth, jobsController.updateJob);

// Handle job deletion
router.post('/delete/:id', auth, jobsController.deleteJob);

module.exports = router;
