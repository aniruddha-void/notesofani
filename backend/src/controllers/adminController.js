const Resource = require('../models/Resource');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Download = require('../models/Download');
const Favorite = require('../models/Favorite');
const UserResourceActivity = require('../models/UserResourceActivity');
const { OFFICIAL_RESOURCE_TYPES } = require('../models/Resource');

const getStats = async (req, res) => {
  try {
    const [
      totalResources,
      publishedResources,
      totalUsers,
      totalSubjects,
      totalDownloadsCount,
      distributionResult,
    ] = await Promise.all([
      Resource.countDocuments(),
      Resource.countDocuments({ $or: [{ published: true }, { status: 'Published' }] }),
      User.countDocuments(),
      Subject.countDocuments({ isActive: true }),
      Download.countDocuments(),
      Resource.aggregate([
        {
          $group: {
            _id: { $ifNull: ['$resourceType', '$type'] },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const draftResources = totalResources >= publishedResources ? totalResources - publishedResources : 0;

    const resourceDistribution = {};
    OFFICIAL_RESOURCE_TYPES.forEach((t) => {
      resourceDistribution[t] = 0;
    });

    distributionResult.forEach((item) => {
      if (item._id && resourceDistribution[item._id] !== undefined) {
        resourceDistribution[item._id] = item.count;
      }
    });

    return res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalResources,
          publishedResources,
          draftResources,
          totalDownloads: totalDownloadsCount,
          totalUsers,
          totalSubjects,
          resourceDistribution,
        },
      },
    });
  } catch (error) {
    console.error('[Admin Stats Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to compute admin statistics.',
    });
  }
};

const getUsersAdmin = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    let query = {};
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query = {
        $or: [{ name: searchRegex }, { email: searchRegex }],
      };
    }

    const totalCount = await User.countDocuments(query);
    const users = await User.find(query)
      .select('_id name email profileImage avatarUrl googleId createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const formattedUsers = users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      profileImage: u.profileImage || u.avatarUrl || '',
      avatarUrl: u.avatarUrl || u.profileImage || '',
      provider: 'Google',
      createdAt: u.createdAt,
    }));

    return res.status(200).json({
      status: 'success',
      data: {
        users: formattedUsers,
        pagination: {
          total: totalCount,
          page: pageNum,
          pages: Math.ceil(totalCount / limitNum) || 1,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    console.error('[Admin Get Users Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve users.',
    });
  }
};

const getUserByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select('_id name email profileImage avatarUrl createdAt updatedAt')
      .lean();

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found.',
      });
    }

    const [viewedCount, downloadCount, favoriteCount] = await Promise.all([
      UserResourceActivity.countDocuments({ user: id }),
      Download.countDocuments({ user: id }),
      Favorite.countDocuments({ user: id }),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage || user.avatarUrl || '',
          avatarUrl: user.avatarUrl || user.profileImage || '',
          provider: 'Google',
          createdAt: user.createdAt,
        },
        activity: {
          viewed: viewedCount,
          downloads: downloadCount,
          favorites: favoriteCount,
        },
      },
    });
  } catch (error) {
    console.error('[Admin Get User By ID Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user details.',
    });
  }
};

module.exports = {
  getStats,
  getUsersAdmin,
  getUserByIdAdmin,
};

