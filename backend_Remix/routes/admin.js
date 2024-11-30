const express = require('express');
const router = express.Router();
const Job = require('../models/job');
const Application = require('../models/application');

// Middleware: Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin privileges required' });
};

// Get all jobs
router.get('/jobs', isAdmin, async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('recruiter', 'username email')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update job status
router.patch('/jobs/:id/status', isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete job
router.delete('/jobs/:id', isAdmin, async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Delete related applications
    await Application.deleteMany({ job: req.params.id });
    
    res.json({ message: 'Successfully deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all applications
router.get('/applications', isAdmin, async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('job', 'title company')
      .populate('applicant', 'username email')
      .populate('recruiter', 'username email')
      .sort({ createdAt: -1 });

    // Handle potential null values
    const processedApplications = applications.map(app => ({
      ...app.toObject(),
      job: app.job || { title: 'Job Deleted', company: 'Company Unavailable' },
      applicant: app.applicant || { username: 'Unknown User', email: 'Email Unavailable' },
      recruiter: app.recruiter || { username: 'Unknown Recruiter', email: 'Email Unavailable' }
    }));

    res.json(processedApplications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 