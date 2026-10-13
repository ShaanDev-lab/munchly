import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import Order from "../models/order.model.js";
import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";
import { sendDeliveryOtpMail } from "../utils/mail.js";
import RazorPay from "razorpay";

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new RazorPay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

const serverError = (res, error) =>
  res.status(500).json({ message: error.message });

const notifyOwners = async (req, order) => {
  await order.populate([
    { path: "shopOrders.shopOrderItems.item", select: "name image price" },
    { path: "shopOrders.shop", select: "name" },
    { path: "shopOrders.owner", select: "name socketId" },
    { path: "user", select: "name email mobile" },
  ]);

  const io = req.app.get("io");
  if (!io) return;

  order.shopOrders.forEach((shopOrder) => {
    const socketId = shopOrder.owner.socketId;
    if (socketId) {
      io.to(socketId).emit("newOrder", {
        _id: order._id,
        paymentMethod: order.paymentMethod,
        user: order.user,
        shopOrders: shopOrder,
        createdAt: order.createdAt,
        deliveryAddress: order.deliveryAddress,
        payment: order.payment,
      });
    }
  });
};

const formatAssignment = (assignment) => {
  const shopOrder = assignment.order.shopOrders.id(assignment.shopOrderId);
  return {
    assignmentId: assignment._id,
    orderId: assignment.order._id,
    shopName: assignment.shop.name,
    deliveryAddress: assignment.order.deliveryAddress,
    items: shopOrder?.shopOrderItems || [],
    subtotal: shopOrder?.subtotal,
  };
};

const findShopOrder = async (orderId, shopOrderId) => {
  const order = await Order.findById(orderId);
  return { order, shopOrder: order?.shopOrders.id(shopOrderId) };
};

export const placeOrder = async (req, res) => {
  try {
    const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body;
    if (!cartItems?.length) {
      return res.status(400).json({ message: "cart is empty" });
    }
    if (
      !deliveryAddress?.text ||
      deliveryAddress.latitude == null ||
      deliveryAddress.longitude == null
    ) {
      return res.status(400).json({ message: "send complete deliveryAddress" });
    }

    const itemsByShop = {};
    for (const item of cartItems) {
      (itemsByShop[item.shop] ||= []).push(item);
    }

    const shopOrders = await Promise.all(
      Object.entries(itemsByShop).map(async ([shopId, items]) => {
        const shop = await Shop.findById(shopId).select("owner");
        if (!shop) {
          throw new Error(`Shop ${shopId} not found`);
        }
        return {
          shop: shop._id,
          owner: shop.owner,
          subtotal: items.reduce(
            (sum, i) => sum + Number(i.price) * Number(i.quantity),
            0,
          ),
          shopOrderItems: items.map((i) => ({
            item: i.id || i._id,
            price: i.price,
            quantity: i.quantity,
            name: i.name,
          })),
        };
      }),
    );

    const orderData = {
      user: req.userId,
      paymentMethod,
      deliveryAddress,
      totalAmount,
      shopOrders,
    };

    if (paymentMethod === "online") {
      if (!razorpay) {
        return res.status(400).json({
          message: "Razorpay credentials are not configured on the server",
        });
      }
      const razorOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });
      const order = await Order.create({
        ...orderData,
        razorpayOrderId: razorOrder.id,
        payment: false,
      });
      return res.json({ razorOrder, orderId: order._id });
    }

    const order = await Order.create(orderData);
    await notifyOwners(req, order);
    return res.status(201).json(order);
  } catch (error) {
    return serverError(res, error);
  }
};

export const verifyPayment = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(400).json({
        message: "Razorpay credentials are not configured on the server",
      });
    }
    const { razorpay_payment_id, orderId } = req.body;
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.status !== "captured") {
      return res.status(400).json({ message: "payment not captured" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "order not found" });
    }

    order.payment = true;
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    await notifyOwners(req, order);
    return res.json(order);
  } catch (error) {
    return serverError(res, error);
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("role");
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    if (user.role === "user") {
      const orders = await Order.find({ user: req.userId })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("shopOrders.owner", "name email mobile")
        .populate("shopOrders.shopOrderItems.item", "name image price");

      return res.json(orders);
    }

    if (user.role === "owner") {
      const orders = await Order.find({ "shopOrders.owner": req.userId })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("user")
        .populate("shopOrders.shopOrderItems.item", "name image price")
        .populate("shopOrders.assignedDeliveryBoy", "fullName mobile");

      const ownerOrders = orders.map((order) => ({
        _id: order._id,
        paymentMethod: order.paymentMethod,
        user: order.user,
        shopOrders: order.shopOrders.find(
          (o) => o.owner.toString() === String(req.userId),
        ),
        createdAt: order.createdAt,
        deliveryAddress: order.deliveryAddress,
        payment: order.payment,
      }));

      return res.json(ownerOrders);
    }

    if (user.role === "deliveryBoy") {
      return res.json([]);
    }

    return res.status(403).json({ message: "invalid role" });
  } catch (error) {
    return serverError(res, error);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, shopId } = req.params;
    const { status } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "order not found" });
    }

    const shopOrder = order.shopOrders.find((o) => String(o.shop) === shopId);
    if (!shopOrder) {
      return res.status(404).json({ message: "shop order not found" });
    }
    shopOrder.status = status;

    const io = req.app.get("io");
    let availableBoys = [];

    if (status === "out of delivery" && !shopOrder.assignment) {
      const { longitude, latitude } = order.shop.address;
      const nearByBoys = await User.find({
        role: "deliveryBoy",
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [Number(longitude), Number(latitude)],
            },
            $maxDistance: 5000,
          },
        },
      });

      const busyIds = await DeliveryAssignment.find({
        assignedTo: { $in: nearByBoys.map((b) => b._id) },
        status: { $in: ["assigned"] },
      }).distinct("assignedTo");
      const busy = new Set(busyIds.map(String));

      availableBoys = nearByBoys.filter((b) => !busy.has(String(b._id)));

      if (availableBoys.length === 0) {
        await order.save();
        return res.json({
          message:
            "order status updated but there is no available delivery boys",
        });
      }

      const assignment = await DeliveryAssignment.create({
        order: order._id,
        shop: shopOrder.shop,
        shopOrderId: shopOrder._id,
        brodcastedTo: availableBoys.map((b) => b._id),
        status: "brodcasted",
      });
      shopOrder.assignment = assignment._id;

      if (io) {
        await assignment.populate(["order", { path: "shop", select: "name" }]);
        const payload = formatAssignment(assignment);
        availableBoys.forEach((boy) => {
          if (boy.socketId) {
            io.to(boy.socketId).emit("newAssignment", {
              sentTo: boy._id,
              ...payload,
            });
          }
        });
      }
    }

    await order.save();
    await order.populate([
      { path: "shopOrders.shop", select: "name" },
      {
        path: "shopOrders.assignedDeliveryBoy",
        select: "fullName email mobile",
      },
      { path: "user", select: "socketId" },
    ]);

    const userSocketId = order.user?.socketId;
    if (io && userSocketId) {
      io.to(userSocketId).emit("update-status", {
        orderId: order._id,
        shopId,
        status: shopOrder.status,
        userId: order.user._id,
      });
    }

    return res.json({
      shopOrder,
      assignedDeliveryBoy: shopOrder.assignedDeliveryBoy,
      availableBoys: availableBoys.map((b) => ({
        id: b._id,
        fullName: b.fullName,
        longitude: b.location.coordinates[0],
        latitude: b.location.coordinates[1],
        mobile: b.mobile,
      })),
      assignment: shopOrder.assignment,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

export const getDeliveryBoyAssignment = async (req, res) => {
  try {
    const assignments = await DeliveryAssignment.find({
      brodcastedTo: req.userId,
      status: "brodcasted",
    })
      .populate("order")
      .populate("shop");

    return res.json(
      assignments.filter((a) => a.order && a.shop).map(formatAssignment),
    );
  } catch (error) {
    return serverError(res, error);
  }
};

export const acceptOrder = async (req, res) => {
  try {
    const assignment = await DeliveryAssignment.findById(
      req.params.assignmentId,
    );
    if (!assignment) {
      return res.status(404).json({ message: "assignment not found" });
    }
    if (assignment.status !== "brodcasted") {
      return res.status(400).json({ message: "assignment is expired" });
    }

    const alreadyAssigned = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: { $nin: ["brodcasted", "completed"] },
    });
    if (alreadyAssigned) {
      return res
        .status(400)
        .json({ message: "You are already assigned to another order" });
    }

    assignment.assignedTo = req.userId;
    assignment.status = "assigned";
    assignment.acceptedAt = new Date();
    await assignment.save();

    const order = await Order.findById(assignment.order);
    if (!order) {
      return res.status(404).json({ message: "order not found" });
    }

    const shopOrder = order.shopOrders.id(assignment.shopOrderId);
    if (!shopOrder) {
      return res.status(404).json({ message: "shop order not found" });
    }
    shopOrder.assignedDeliveryBoy = req.userId;
    await order.save();

    return res.json({ message: "order accepted" });
  } catch (error) {
    return serverError(res, error);
  }
};

export const getCurrentOrder = async (req, res) => {
  try {
    const assignment = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: "assigned",
    })
      .populate("assignedTo", "location")
      .populate({
        path: "order",
        populate: { path: "user", select: "fullName email location mobile" },
      });

    if (!assignment) {
      return res.status(404).json({ message: "assignment not found" });
    }
    if (!assignment.order) {
      return res.status(404).json({ message: "order not found" });
    }

    const shopOrder = assignment.order.shopOrders.id(assignment.shopOrderId);
    if (!shopOrder) {
      return res.status(404).json({ message: "shopOrder not found" });
    }

    const [lon = null, lat = null] =
      assignment.assignedTo?.location?.coordinates ?? [];
    const address = assignment.order.deliveryAddress;

    return res.json({
      _id: assignment.order._id,
      user: assignment.order.user,
      shopOrder,
      deliveryAddress: address,
      deliveryBoyLocation: { lat, lon },
      customerLocation: {
        lat: address?.latitude ?? null,
        lon: address?.longitude ?? null,
      },
    });
  } catch (error) {
    return serverError(res, error);
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("user")
      .populate("shopOrders.shop")
      .populate("shopOrders.assignedDeliveryBoy")
      .populate("shopOrders.shopOrderItems.item")
      .lean();

    if (!order) {
      return res.status(404).json({ message: "order not found" });
    }
    return res.json(order);
  } catch (error) {
    return serverError(res, error);
  }
};

export const sendDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId } = req.body;
    const { order, shopOrder } = await findShopOrder(orderId, shopOrderId);
    if (!shopOrder) {
      return res.status(400).json({ message: "enter valid order/shopOrderid" });
    }

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    shopOrder.deliveryOtp = otp;
    shopOrder.otpExpires = Date.now() + 5 * 60 * 1000;
    await order.save();

    await order.populate("user");
    await sendDeliveryOtpMail(order.user, otp);
    return res.json({
      message: `Otp sent Successfuly to ${order.user?.fullName}`,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

export const verifyDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId, otp } = req.body;
    const { order, shopOrder } = await findShopOrder(orderId, shopOrderId);
    if (!shopOrder) {
      return res.status(400).json({ message: "enter valid order/shopOrderid" });
    }

    if (
      !otp ||
      !shopOrder.deliveryOtp ||
      String(shopOrder.deliveryOtp) !== String(otp) ||
      !(shopOrder.otpExpires > Date.now())
    ) {
      return res.status(400).json({ message: "Invalid/Expired Otp" });
    }

    shopOrder.status = "delivered";
    shopOrder.deliveredAt = Date.now();
    await order.save();
    await DeliveryAssignment.deleteOne({
      shopOrderId: shopOrder._id,
      order: order._id,
      assignedTo: shopOrder.assignedDeliveryBoy,
    });

    return res.json({ message: "Order Delivered Successfully!" });
  } catch (error) {
    return serverError(res, error);
  }
};
