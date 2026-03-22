import { Response, NextFunction } from 'express';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';

// Get user's cart
export const getCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    let cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart) {
      // Create empty cart if doesn't exist
      cart = await Cart.create({ user: userId, items: [] });
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// Add item to cart
export const addToCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
      return;
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      });
      return;
    }

    // Check stock
    if (!product.inStock || product.stockQuantity < quantity) {
      res.status(400).json({
        success: false,
        error: 'Product out of stock'
      });
      return;
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // Create new cart
      cart = await Cart.create({
        user: userId,
        items: [{
          product: productId,
          quantity,
          price: product.price
        }]
      });
    } else {
      // Check if product already in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity
        cart.items[existingItemIndex].quantity += quantity;
        // Update price in case it changed
        cart.items[existingItemIndex].price = product.price;
      } else {
        // Add new item
        cart.items.push({
          product: productId,
          quantity,
          price: product.price
        });
      }

      await cart.save();
    }

    // Populate product details
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// Update cart item quantity
export const updateCartItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      res.status(400).json({
        success: false,
        error: 'Product ID and quantity are required'
      });
      return;
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
      return;
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      });
      return;
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items.splice(itemIndex, 1);
    } else {
      // Verify stock
      const product = await Product.findById(productId);
      if (product && (!product.inStock || product.stockQuantity < quantity)) {
        res.status(400).json({
          success: false,
          error: 'Insufficient stock'
        });
        return;
      }

      // Update quantity
      cart.items[itemIndex].quantity = quantity;
      // Update price if product found
      if (product) {
        cart.items[itemIndex].price = product.price;
      }
    }

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// Remove item from cart
export const removeFromCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
      return;
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// Clear cart
export const clearCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
      return;
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// Sync cart from localStorage (merge)
export const syncCart = async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      res.status(400).json({
        success: false,
        error: 'Items must be an array'
      });
      return;
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    // Merge items from localStorage
    for (const localItem of items) {
      const { productId, quantity } = localItem;

      // Verify product exists
      const product = await Product.findById(productId);
      if (!product) continue;

      const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Keep the higher quantity
        cart.items[existingItemIndex].quantity = Math.max(
          cart.items[existingItemIndex].quantity,
          quantity
        );
        cart.items[existingItemIndex].price = product.price;
      } else {
        cart.items.push({
          product: productId,
          quantity,
          price: product.price
        });
      }
    }

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Cart synced successfully',
      data: cart
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync cart'
    });
  }
};
