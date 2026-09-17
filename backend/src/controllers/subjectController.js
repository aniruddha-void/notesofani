const Subject = require('../models/Subject');
const Resource = require('../models/Resource');

/**
 * GET /api/v1/subjects (Public)
 * Returns active subjects list.
 */
const getSubjects = async (req, res) => {
  try {
    const query = { isActive: true };
    const subjects = await Subject.find(query).sort({ name: 1 }).lean();

    // Calculate real resource count per subject
    const subjectIds = subjects.map((s) => s._id);
    const counts = await Resource.aggregate([
      { $match: { subject: { $in: subjectIds } } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    const subjectsWithCounts = subjects.map((s) => ({
      ...s,
      resourcesCount: countMap[s._id.toString()] || 0,
    }));

    return res.status(200).json({
      status: 'success',
      data: { subjects: subjectsWithCounts },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch subjects.',
    });
  }
};

/**
 * POST /api/v1/subjects (Admin Only)
 * Creates a new subject.
 */
const createSubject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Subject name is required.',
      });
    }

    const trimmedName = name.trim();
    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Case-insensitive duplicate check
    const existing = await Subject.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
    });
    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: 'A subject with this name already exists.',
      });
    }

    const subject = await Subject.create({
      name: trimmedName,
      description: description ? description.trim() : '',
      isActive: true,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Subject created successfully.',
      data: { subject },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create subject.',
    });
  }
};

/**
 * PUT /api/v1/subjects/:id (Admin Only)
 * Updates/renames an existing subject.
 */
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        status: 'error',
        message: 'Subject not found.',
      });
    }

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Subject name cannot be empty.',
        });
      }

      const trimmedName = name.trim();
      const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Check duplicate name on another document (case-insensitive)
      const duplicate = await Subject.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
      });

      if (duplicate) {
        return res.status(400).json({
          status: 'error',
          message: 'A subject with this name already exists.',
        });
      }

      subject.name = trimmedName;
    }

    if (description !== undefined) subject.description = description.trim();
    if (isActive !== undefined) subject.isActive = Boolean(isActive);

    await subject.save();

    return res.status(200).json({
      status: 'success',
      message: 'Subject updated successfully.',
      data: { subject },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update subject.',
    });
  }
};

/**
 * DELETE /api/v1/subjects/:id (Admin Only)
 * Deletes a subject if no resources are linked to it.
 */
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        status: 'error',
        message: 'Subject not found.',
      });
    }

    // Safety check: Prevent deletion if any resources are linked to this subject
    const linkedResourcesCount = await Resource.countDocuments({ subject: id });
    if (linkedResourcesCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot delete subject "${subject.name}" because ${linkedResourcesCount} resource(s) are linked to it. Please reassign or delete the linked resources first.`,
      });
    }

    await Subject.findByIdAndDelete(id);

    return res.status(200).json({
      status: 'success',
      message: 'Subject deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete subject.',
    });
  }
};

module.exports = {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
};
