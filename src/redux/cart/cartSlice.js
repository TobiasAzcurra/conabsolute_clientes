import { createSlice } from '@reduxjs/toolkit';

const getTotal = (cart, envioExpress = 0) => {
  let total = 0;
  cart.forEach(({ price, quantity }) => {
    total += price * quantity;
  });
  return total + envioExpress;
};

export const cartSlices = createSlice({
  name: 'products',
  initialState: {
    cart: [],
    lastCart: [],
    total: 0,
    envioExpress: 0,
  },

  reducers: {
    setEnvioExpress: (state, action) => {
      state.envioExpress = action.payload;
      state.total = getTotal(state.cart, state.envioExpress);
    },

    addItem: (state, action) => {
      const item = action.payload;
      const existingItemIndex = state.cart.findIndex(
        (cartItem) =>
          cartItem.name === item.name && cartItem.category === item.category
      );

      if (existingItemIndex >= 0) {
        state.cart[existingItemIndex].quantity += item.quantity;
      } else {
        state.cart.push({ ...item });
      }

      state.total = getTotal(state.cart, state.envioExpress);
    },

    updateItemQuantity: (state, action) => {
      const { name, category, quantity } = action.payload;
      const existingItemIndex = state.cart.findIndex(
        (cartItem) => cartItem.name === name && cartItem.category === category
      );

      if (existingItemIndex >= 0) {
        state.cart[existingItemIndex].quantity = quantity;
      }

      state.total = getTotal(state.cart, state.envioExpress);
    },

    removeOneItem: (state, action) => {
      const index = action.payload;
      state.cart[index].quantity -= 1;
      state.total = getTotal(state.cart, state.envioExpress);
    },

    addOneItem: (state, action) => {
      const index = action.payload;
      state.cart[index].quantity += 1;
      state.total = getTotal(state.cart, state.envioExpress);
    },

    removeItem: (state, action) => {
      state.cart.splice(action.payload, 1);
      state.total = getTotal(state.cart, state.envioExpress);
    },

    clearCart: (state) => {
      state.cart = [];
      state.total = 0;
    },

    addLastCart: (state) => {
      state.lastCart = state.cart;
    },

    changeLastCart: (state) => {
      state.cart = state.lastCart;
      state.total = getTotal(state.lastCart, state.envioExpress);
    },
  },
});

export const {
  addItem,
  updateItemQuantity,
  removeOneItem,
  addOneItem,
  clearCart,
  removeItem,
  addLastCart,
  changeLastCart,
  setEnvioExpress,
} = cartSlices.actions;

export default cartSlices.reducer;
