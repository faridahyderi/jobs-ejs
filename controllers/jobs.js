const Job = require('../models/Job');
const parseValidationErrs = require('../util/parseValidationErr'); // assuming this is for validation parsing

exports.index = async (req, res) => {
  try {
    const jobs = await Job.find({ createdBy: req.user._id });
    res.render('jobs', { jobs });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.newJob = (req, res) => {
  res.render('job', { job: null }); // Pass null for a new job
};

exports.editJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send('Forbidden');
    }
    res.render('job', { job });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.createJob = async (req, res) => {
  try {
    const { company, position, status } = req.body;
    const job = new Job({
      company,
      position,
      status,
      createdBy: req.user._id,
    });
    await job.save();
    res.redirect('/jobs'); // Redirect to jobs list after creation
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.updateJob = async (req, res) => {
  try {
    const { company, position, status } = req.body;
    const job = await Job.findById(req.params.id);
    if (job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send('Forbidden');
    }
    job.company = company;
    job.position = position;
    job.status = status;
    await job.save();
    res.redirect('/jobs'); // Redirect to jobs list after update
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send('Forbidden');
    }
    await job.remove();
    res.redirect('/jobs'); // Redirect to jobs list after deletion
  } catch (error) {
    res.status(500).send(error.message);
  }
};
