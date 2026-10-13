import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const escapeRegExp = (str) =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createEditShop = async (req, res) => {
  try {
    const { name, city, state, address } = req.body;
    let image;

    if (req.file) {
      image = await uploadOnCloudinary(req.file.path);
    }

    let shop = await Shop.findOne({ owner: req.userId });
    let isNew = false;
    if (!shop) {
      if (!image) {
        return res.status(400).json({ message: "Shop image is required" });
      }
      isNew = true;
      shop = await Shop.create({
        name,
        city,
        state,
        address,
        image,
        owner: req.userId,
      });
    } else {
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (city !== undefined) updateData.city = city;
      if (state !== undefined) updateData.state = state;
      if (address !== undefined) updateData.address = address;
      if (image) {
        updateData.image = image;
      }
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }
      shop = await Shop.findByIdAndUpdate(shop._id, updateData, { new: true });
    }

    await shop.populate("owner");
    await shop.populate("items");
    return res.status(isNew ? 201 : 200).json(shop);
  } catch (error) {
    return res
      .status(500)
      .json({
        message: `create shop error ${error?.message || "internal server error"}`,
      });
  }
};

export const getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.userId })
      .populate("owner")
      .populate({
        path: "items",
        options: { sort: { updatedAt: -1 } },
      });
    if (!shop) {
      return res.status(200).json(null);
    }
    return res.status(200).json(shop);
  } catch (error) {
    return res
      .status(500)
      .json({
        message: `get my shop error ${error?.message || "internal server error"}`,
      });
  }
};

export const getShopByCity = async (req, res) => {
  try {
    const { city } = req.params;

    const shops = await Shop.find({
      city: { $regex: new RegExp(`^${escapeRegExp(city)}$`, "i") },
    }).populate("items");
    return res.status(200).json(shops);
  } catch (error) {
    return res
      .status(500)
      .json({
        message: `get shop by city error ${error?.message || "internal server error"}`,
      });
  }
};
