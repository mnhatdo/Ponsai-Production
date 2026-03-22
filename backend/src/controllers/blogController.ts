import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import Blog from '../models/Blog';
import AuditLog from '../models/AuditLog';
import { AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

// Helper to create audit log
const createAuditLog = async (
  req: AuthRequest,
  action: string,
  entityId?: mongoose.Types.ObjectId,
  entityName?: string,
  previousData?: any,
  newData?: any
) => {
  try {
    await AuditLog.create({
      action,
      entityType: 'blog',
      entityId,
      entityName,
      user: req.user?.id,
      userName: req.user?.name || req.user?.email,
      userRole: req.user?.role,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      previousData,
      newData,
      status: 'success'
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// ================================
// PUBLIC ROUTES
// ================================

// Get all published blogs (public)
export const getPublicBlogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = { status: 'published' };

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by tag
    if (req.query.tag) {
      query.tags = req.query.tag;
    }

    // Search
    if (req.query.search) {
      query.$text = { $search: req.query.search as string };
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'name avatar')
        .select('-content')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single blog by slug (public)
export const getBlogBySlug = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const blog = await Blog.findOne({ 
      slug: req.params.slug,
      status: 'published'
    })
      .populate('author', 'name avatar')
      .lean();

    if (!blog) {
      return next(new AppError('Blog not found', 404));
    }

    // Increment view count
    await Blog.findByIdAndUpdate(blog._id, { $inc: { viewCount: 1 } });

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    next(error);
  }
};

// Get featured blogs (public)
export const getFeaturedBlogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const blogs = await Blog.find({ 
      status: 'published',
      featured: true
    })
      .populate('author', 'name avatar')
      .select('-content')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: blogs
    });
  } catch (error) {
    next(error);
  }
};

// Get related blogs (public)
export const getRelatedBlogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return next(new AppError('Blog not found', 404));
    }

    const relatedBlogs = await Blog.find({
      _id: { $ne: blog._id },
      status: 'published',
      $or: [
        { category: blog.category },
        { tags: { $in: blog.tags } }
      ]
    })
      .populate('author', 'name avatar')
      .select('-content')
      .sort({ publishedAt: -1 })
      .limit(4)
      .lean();

    res.status(200).json({
      success: true,
      data: relatedBlogs
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// ADMIN ROUTES
// ================================

// Get all blogs (admin)
export const getAdminBlogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query: any = {};

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by author
    if (req.query.author) {
      query.author = req.query.author;
    }

    // Search
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { excerpt: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'name email avatar')
        .select('-content')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get blog by ID (admin)
export const getAdminBlogById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name email avatar')
      .lean();

    if (!blog) {
      return next(new AppError('Blog not found', 404));
    }

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    next(error);
  }
};

// Create blog (admin)
export const createBlog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      images,
      category,
      tags,
      status,
      featured,
      seo
    } = req.body;

    // Generate slug if not provided
    const finalSlug = slug || title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check for duplicate slug
    const existingBlog = await Blog.findOne({ slug: finalSlug });
    if (existingBlog) {
      return next(new AppError('A blog with this slug already exists', 400));
    }

    const blog = await Blog.create({
      title,
      slug: finalSlug,
      excerpt,
      content,
      featuredImage,
      images,
      author: req.user!.id,
      category,
      tags: tags || [],
      status: status || 'draft',
      featured: featured || false,
      seo,
      publishedAt: status === 'published' ? new Date() : undefined
    });

    await createAuditLog(
      req,
      'blog_create',
      blog._id,
      blog.title,
      undefined,
      { title, slug: finalSlug, status }
    );

    const populatedBlog = await Blog.findById(blog._id)
      .populate('author', 'name email avatar')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedBlog
    });
  } catch (error) {
    next(error);
  }
};

// Update blog (admin)
export const updateBlog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return next(new AppError('Blog not found', 404));
    }

    const previousData = blog.toObject();
    const updateData = { ...req.body };

    // Handle status change to published
    if (updateData.status === 'published' && blog.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    // Check for duplicate slug if slug is being changed
    if (updateData.slug && updateData.slug !== blog.slug) {
      const existingBlog = await Blog.findOne({ slug: updateData.slug, _id: { $ne: blog._id } });
      if (existingBlog) {
        return next(new AppError('A blog with this slug already exists', 400));
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('author', 'name email avatar')
      .lean();

    await createAuditLog(
      req,
      'blog_update',
      blog._id,
      blog.title,
      previousData,
      updateData
    );

    res.status(200).json({
      success: true,
      data: updatedBlog
    });
  } catch (error) {
    next(error);
  }
};

// Delete blog (admin)
export const deleteBlog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return next(new AppError('Blog not found', 404));
    }

    await Blog.findByIdAndDelete(req.params.id);

    await createAuditLog(
      req,
      'blog_delete',
      blog._id,
      blog.title,
      blog.toObject()
    );

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Bulk delete blogs (admin)
export const bulkDeleteBlogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return next(new AppError('Please provide blog IDs to delete', 400));
    }

    const blogs = await Blog.find({ _id: { $in: ids } });
    
    await Blog.deleteMany({ _id: { $in: ids } });

    await createAuditLog(
      req,
      'blog_bulk_delete',
      undefined,
      `${blogs.length} blogs`,
      { deletedBlogs: blogs.map(b => ({ id: b._id, title: b.title })) }
    );

    res.status(200).json({
      success: true,
      message: `${blogs.length} blogs deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Toggle blog status (admin)
export const toggleBlogStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return next(new AppError('Blog not found', 404));
    }

    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    const updateData: any = { status: newStatus };
    
    if (newStatus === 'published' && !blog.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('author', 'name email avatar')
      .lean();

    await createAuditLog(
      req,
      'blog_status_update',
      blog._id,
      blog.title,
      { status: blog.status },
      { status: newStatus }
    );

    res.status(200).json({
      success: true,
      data: updatedBlog
    });
  } catch (error) {
    next(error);
  }
};

// Toggle blog featured (admin)
export const toggleBlogFeatured = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return next(new AppError('Blog not found', 404));
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { featured: !blog.featured },
      { new: true }
    )
      .populate('author', 'name email avatar')
      .lean();

    await createAuditLog(
      req,
      'blog_featured_update',
      blog._id,
      blog.title,
      { featured: blog.featured },
      { featured: !blog.featured }
    );

    res.status(200).json({
      success: true,
      data: updatedBlog
    });
  } catch (error) {
    next(error);
  }
};

// Get blog statistics (admin)
export const getBlogStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalViews,
      byCategory,
      recentBlogs
    ] = await Promise.all([
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'published' }),
      Blog.countDocuments({ status: 'draft' }),
      Blog.aggregate([
        { $group: { _id: null, totalViews: { $sum: '$viewCount' }, totalLikes: { $sum: '$likes' } } }
      ]),
      Blog.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Blog.find()
        .select('title slug status viewCount publishedAt createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        archivedBlogs: totalBlogs - publishedBlogs - draftBlogs,
        totalViews: totalViews[0]?.totalViews || 0,
        totalLikes: totalViews[0]?.totalLikes || 0,
        byCategory,
        recentBlogs
      }
    });
  } catch (error) {
    next(error);
  }
};
