import Item from "../models/item.model.js";
import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sortedItems = { path: "items", options: { sort: { updatedAt: -1 } } };

const getShopIdsByCity = async (city) => {
  const shops = await Shop.find({
    city: { $regex: new RegExp(`^${escapeRegExp(city)}$`, "i") },
  }).select("_id");
  return shops.map((s) => s._id);
};

export const addItem = async (req, res) => {
  try {
    const { name, category, foodType, price } = req.body;

    const image = req.file ? await uploadOnCloudinary(req.file.path) : null;
    if (!image) {
      return res.status(400).json({ message: "Item image is required" });
    }

    const shop = await Shop.findOne({ owner: req.userId });
    if (!shop) {
      return res.status(404).json({ message: "shop not found" });
    }

    const item = await Item.create({
      name,
      category,
      foodType,
      price,
      image,
      shop: shop._id,
    });

    shop.items.push(item._id);
    await shop.save();
    await shop.populate(["owner", sortedItems]);

    return res.status(201).json(shop);
  } catch (error) {
    return res.status(500).json({ message: `add item error ${error.message}` });
  }
};

export const editItem = async (req, res) => {
  try {
    const { name, category, foodType, price } = req.body;

    const updateData = { name, category, foodType, price };
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    if (req.file) {
      const image = await uploadOnCloudinary(req.file.path);
      if (image) updateData.image = image;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const item = await Item.findByIdAndUpdate(req.params.itemId, updateData, {
      new: true,
    });
    if (!item) {
      return res.status(404).json({ message: "item not found" });
    }

    const shop = await Shop.findOne({ owner: req.userId }).populate(
      sortedItems,
    );
    return res.status(200).json(shop);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `edit item error ${error.message}` });
  }
};

export const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "item not found" });
    }
    return res.status(200).json(item);
  } catch (error) {
    return res.status(500).json({ message: `get item error ${error.message}` });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "item not found" });
    }

    const shop = await Shop.findOne({ owner: req.userId });
    if (!shop) {
      return res.status(404).json({ message: "shop not found" });
    }

    shop.items = shop.items.filter((i) => i.toString() !== item._id.toString());
    await shop.save();
    await shop.populate(sortedItems);

    return res.status(200).json(shop);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `delete item error ${error.message}` });
  }
};

export const getItemByCity = async (req, res) => {
  try {
    const { city } = req.params;
    if (!city) {
      return res.status(400).json({ message: "city is required" });
    }

    const shopIds = await getShopIdsByCity(city);
    const items = await Item.find({ shop: { $in: shopIds } });
    return res.status(200).json(items);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `get item by city error ${error.message}` });
  }
};

export const getItemsByShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId).populate("items");
    if (!shop) {
      return res.status(404).json({ message: "shop not found" });
    }
    return res.status(200).json({ shop, items: shop.items });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `get item by shop error ${error.message}` });
  }
};

export const searchItems = async (req, res) => {
  try {
    const { query, city } = req.query;
    if (!query || !city) {
      return res.status(400).json({ message: "query and city are required" });
    }

    const shopIds = await getShopIdsByCity(city);
    const safeQuery = escapeRegExp(query);

    const items = await Item.find({
      shop: { $in: shopIds },
      $or: [
        { name: { $regex: safeQuery, $options: "i" } },
        { category: { $regex: safeQuery, $options: "i" } },
      ],
    }).populate("shop", "name image");

    return res.status(200).json(items);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `search item error ${error.message}` });
  }
};


