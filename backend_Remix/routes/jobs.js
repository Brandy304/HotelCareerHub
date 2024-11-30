const express = require('express');
const router = express.Router();
const Job = require('../models/job');

const isRecruiter = (req, res, next) => {
    console.log(req.user)
  if (req.user && req.user.role === 'recruiter') {
    return next();
  }
  res.status(403).json({ error: 'Only recruiters can perform this operation' });
};

// 获取职位列表
router.get('/', async (req, res) => {
  try {
    const query = {};
    
    if (req.user?.role === 'recruiter') {
      // 招聘方只能看到自己发布的职位
      query.recruiter = req.user._id;
    } else {
      // 普通用户只能看到激活状态的职位
      query.status = 'active';
    }
    
    const jobs = await Job.find(query)
      .populate('recruiter', 'username email')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建新职位
router.post('/', isRecruiter, async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      recruiter: req.user._id
    };
    const job = new Job(jobData);
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 更新职位
router.put('/:id', isRecruiter, async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      recruiter: req.user._id
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found or no permission to modify' });
    }

    Object.assign(job, req.body);
    job.updatedAt = new Date();
    await job.save();
    res.json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 更新职位状态
router.patch('/:id/status', isRecruiter, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const job = await Job.findOne({
      _id: req.params.id,
      recruiter: req.user._id
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found or no permission to modify' });
    }

    job.status = status;
    job.updatedAt = new Date();
    await job.save();
    
    res.json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 删除职位
router.delete('/:id', isRecruiter, async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      recruiter: req.user._id
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found or no permission to delete' });
    }
    
    res.json({ message: 'Successfully deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 