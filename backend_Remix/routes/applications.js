const express = require('express');
const router = express.Router();
const Application = require('../models/application');
const Job = require('../models/job');

// Middleware: Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Please login first' });
};

// Get received applications (recruiter)
router.get('/received', isAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ error: 'Only recruiters can view received applications' });
    }

    const applications = await Application.find({ recruiter: req.user._id })
      .populate('job')
      .populate('applicant', 'username email')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sent applications (jobseeker)
router.get('/sent', isAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({ error: 'Only job seekers can view sent applications' });
    }

    const applications = await Application.find({ applicant: req.user._id })
      .populate('job')
      .populate('recruiter', 'username email')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit new application
router.post('/', isAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({ error: 'Only job seekers can submit applications' });
    }

    const { jobId, coverLetter } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this position' });
    }

    const application = new Application({
      job: jobId,
      applicant: req.user._id,
      recruiter: job.recruiter,
      coverLetter
    });

    await application.save();

    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update application status (recruiter)
router.patch('/:id/status', isAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ error: 'Only recruiters can update application status' });
    }

    const { status } = req.body;
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const application = await Application.findOne({
      _id: req.params.id,
      recruiter: req.user._id
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found or no permission to modify' });
    }

    application.status = status;
    await application.save();

    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete application (jobseeker)
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({ error: 'Only job seekers can withdraw applications' });
    }

    const application = await Application.findOne({
      _id: req.params.id,
      applicant: req.user._id,
      status: 'pending' // Can only delete pending applications
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found or cannot be deleted' });
    }

    await application.remove();
    res.json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 