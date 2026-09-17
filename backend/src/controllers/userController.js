const Favorite = require('../models/Favorite');
const Download = require('../models/Download');
const Resource = require('../models/Resource');
const User = require('../models/User');
const UserResourceActivity = require('../models/UserResourceActivity');

/**
 * GET /api/v1/user/favorites (Authenticated User)
 * Gets favorited resources belonging only to the authenticated user.
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;

    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: 'resource',
        match: { published: true },
        populate: { path: 'subject', select: 'name code description' },
      })
      .sort({ createdAt: -1 });

    // Filter out null resource references (if a resource was un-published or deleted)
    const validFavorites = favorites.filter((fav) => fav.resource !== null);

    return res.status(200).json({
      status: 'success',
      data: { favorites: validFavorites },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: "Failed to fetch user's favorites.",
    });
  }
};

/**
 * POST /api/v1/user/favorites/:resourceId (Authenticated User)
 * Adds a resource to user's favorites list. Uses unique compound index from Phase 2.
 */
const addFavorite = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user._id;

    // Verify valid published resource
    const resource = await Resource.findOne({ _id: resourceId, published: true });
    if (!resource) {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found or not available to favorite.',
      });
    }

    // Check existing favorite
    const existing = await Favorite.findOne({ user: userId, resource: resourceId });
    if (existing) {
      return res.status(200).json({
        status: 'success',
        message: 'Resource is already in favorites.',
        data: { favorite: existing },
      });
    }

    const favorite = await Favorite.create({
      user: userId,
      resource: resourceId,
    });

    const populated = await Favorite.findById(favorite._id).populate('resource');

    return res.status(201).json({
      status: 'success',
      message: 'Resource added to favorites.',
      data: { favorite: populated },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        status: 'success',
        message: 'Resource is already in favorites.',
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Failed to add resource to favorites.',
    });
  }
};

/**
 * DELETE /api/v1/user/favorites/:resourceId (Authenticated User)
 * Removes a resource from user's favorites.
 */
const removeFavorite = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user._id;

    await Favorite.findOneAndDelete({ user: userId, resource: resourceId });

    return res.status(200).json({
      status: 'success',
      message: 'Resource removed from favorites.',
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to remove favorite.',
    });
  }
};

/**
 * GET /api/v1/user/downloads (Authenticated User)
 * Returns authenticated user's download history only.
 */
const getDownloadHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const history = await Download.find({ user: userId })
      .populate({
        path: 'resource',
        populate: { path: 'subject', select: 'name code description' },
      })
      .sort({ downloadedAt: -1 });

    const validHistory = history.filter((item) => item.resource !== null);

    return res.status(200).json({
      status: 'success',
      data: { history: validHistory },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch download history.',
    });
  }
};

/**
 * POST /api/v1/user/views/:resourceId (Authenticated User)
 * Records or updates a resource view activity for the logged-in user.
 */
const recordView = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user._id;

    const resource = await Resource.findOne({ _id: resourceId, published: true });
    if (!resource) {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found or not published.',
      });
    }

    const activity = await UserResourceActivity.findOneAndUpdate(
      { user: userId, resource: resourceId },
      {
        lastViewedAt: new Date(),
        $inc: { viewCount: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Resource view recorded.',
      data: { activity },
    });
  } catch (error) {
    console.error('[Record View Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to record resource view.',
    });
  }
};

/**
 * GET /api/v1/user/dashboard (Authenticated User)
 * Returns student learning overview statistics & recently viewed resources.
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Real MongoDB metrics
    const [viewedCount, downloadsCount, favoritesCount, recentActivities] = await Promise.all([
      UserResourceActivity.countDocuments({ user: userId }),
      Download.countDocuments({ user: userId }),
      Favorite.countDocuments({ user: userId }),
      UserResourceActivity.find({ user: userId })
        .sort({ lastViewedAt: -1 })
        .limit(5)
        .populate({
          path: 'resource',
          populate: { path: 'subject', select: 'name code description' },
        }),
    ]);

    // Filter out null or unpublished resource references
    const validRecentlyViewed = recentActivities
      .filter((act) => act.resource && act.resource.published)
      .map((act) => ({
        _id: act._id,
        resource: act.resource,
        lastViewedAt: act.lastViewedAt,
        viewCount: act.viewCount,
      }));

    return res.status(200).json({
      status: 'success',
      data: {
        stats: {
          viewed: viewedCount,
          downloads: downloadsCount,
          favorites: favoritesCount,
        },
        recentlyViewed: validRecentlyViewed,
      },
    });
  } catch (error) {
    console.error('[Get Dashboard Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch student dashboard data.',
    });
  }
};

/**
 * GET /api/v1/user/profile (Authenticated User)
 * Returns user profile details.
 */
const getProfile = async (req, res) => {
  return res.status(200).json({
    status: 'success',
    data: { user: req.user },
  });
};

/**
 * PUT /api/v1/user/profile (Authenticated User)
 * Updates user profile details (e.g. name, avatarUrl).
 */
const updateProfile = async (req, res) => {
  try {
    const { name, avatarUrl, profileImage } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User account not found.',
      });
    }

    if (name) user.name = name.trim();
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully.',
      data: { user },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update profile.',
    });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  getDownloadHistory,
  recordView,
  getDashboard,
  getProfile,
  updateProfile,
};
