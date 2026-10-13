import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    authLoading: true,
    currentCity: null,
    currentState: null,
    currentAddress: null,
    shopInMyCity: null,
    itemsInMyCity: null,
    cartItems: [],
    totalAmount: 0,
    myOrders: [],
    searchItems: null,
    socket: null,
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
    setAuthLoading: (state, action) => {
      state.authLoading = action.payload;
    },
    clearCart: (state) => {
      state.cartItems = [];
      state.totalAmount = 0;
    },
    setCurrentCity: (state, action) => {
      state.currentCity = action.payload;
    },
    setCurrentState: (state, action) => {
      state.currentState = action.payload;
    },
    setCurrentAddress: (state, action) => {
      state.currentAddress = action.payload;
    },
    setShopsInMyCity: (state, action) => {
      state.shopInMyCity = action.payload;
    },
    setItemsInMyCity: (state, action) => {
      state.itemsInMyCity = action.payload;
    },
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
    addToCart: (state, action) => {
      const cartItem = action.payload;
      const existingItem = state.cartItems.find(
        (i) => String(i.id) === String(cartItem.id),
      );
      if (existingItem) {
        existingItem.quantity += cartItem.quantity;
      } else {
        state.cartItems.push(cartItem);
      }

      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0,
      );
    },

    setTotalAmount: (state, action) => {
      state.totalAmount = action.payload;
    },

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.cartItems.find((i) => String(i.id) === String(id));
      if (item) {
        item.quantity = quantity;
      }
      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0,
      );
    },

    removeCartItem: (state, action) => {
      state.cartItems = state.cartItems.filter(
        (i) => String(i.id) !== String(action.payload),
      );
      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0,
      );
    },

    setMyOrders: (state, action) => {
      state.myOrders = action.payload;
    },
    addMyOrder: (state, action) => {
      const exists = state.myOrders.some(
        (o) => String(o._id) === String(action.payload?._id),
      );
      if (!exists) {
        state.myOrders = [action.payload, ...state.myOrders];
      }
    },

    updateOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload;
      const order = state.myOrders.find((o) => String(o._id) === String(orderId));
      if (!order) return;
      const matchesShop = (shop) => {
        if (!shop) return false;
        // shop may be populated object or plain id string
        const id = typeof shop === "object" ? shop._id : shop;
        return String(id) === String(shopId);
      };
      if (Array.isArray(order.shopOrders)) {
        const shopOrder = order.shopOrders.find((so) => matchesShop(so.shop));
        if (shopOrder) {
          shopOrder.status = status;
        }
      } else if (order.shopOrders) {
        if (matchesShop(order.shopOrders.shop)) {
          order.shopOrders.status = status;
        }
      }
    },

    updateRealtimeOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload;
      const order = state.myOrders.find(
        (o) => String(o._id) === String(orderId),
      );
      if (!order) return;
      if (Array.isArray(order.shopOrders)) {
        const shopOrder = order.shopOrders.find((so) => {
          const id = typeof so.shop === "object" ? so.shop?._id : so.shop;
          return String(id) === String(shopId);
        });
        if (shopOrder) {
          shopOrder.status = status;
        }
      } else if (order.shopOrders) {
        const id =
          typeof order.shopOrders.shop === "object"
            ? order.shopOrders.shop?._id
            : order.shopOrders.shop;
        if (String(id) === String(shopId)) {
          order.shopOrders.status = status;
        }
      }
    },

    setSearchItems: (state, action) => {
      state.searchItems = action.payload;
    },
  },
});

export const {
  setUserData,
  setAuthLoading,
  clearCart,
  setCurrentAddress,
  setCurrentCity,
  setCurrentState,
  setShopsInMyCity,
  setItemsInMyCity,
  addToCart,
  updateQuantity,
  removeCartItem,
  setMyOrders,
  addMyOrder,
  updateOrderStatus,
  setSearchItems,
  setTotalAmount,
  setSocket,
  updateRealtimeOrderStatus,
} = userSlice.actions;
export default userSlice.reducer;
