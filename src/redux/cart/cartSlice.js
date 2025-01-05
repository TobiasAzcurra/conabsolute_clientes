import { createSlice } from "@reduxjs/toolkit";

const getTotal = (cart, envioExpress = 0) => {
	let total = 0;
	let totalToppings = 0;
	cart.forEach(({ price, quantity, toppings }) => {
		total += price * quantity;
		toppings.forEach(({ price }) => {
			totalToppings += price * quantity;
		});
	});
	return total + totalToppings + envioExpress;
};

export const cartSlices = createSlice({
	name: "products",
	initialState: {
		cart: [],
		lastCart: [],
		total: 0,
		envioExpress: 0,
	},

	reducers: {
		// Add a new reducer to handle express delivery:
		setEnvioExpress: (state, action) => {
			state.envioExpress = action.payload;
			state.total = getTotal(state.cart, state.envioExpress);
		},
		addItem: (state, action) => {
			const item = action.payload;
			const existingItemIndex = state.cart.findIndex(
				(cartItem) =>
					cartItem.name === item.name &&
					JSON.stringify(cartItem.toppings) === JSON.stringify(item.toppings)
			);

			if (existingItemIndex >= 0) {
				state.cart[existingItemIndex].quantity += item.quantity;
			} else {
				state.cart = [...state.cart, { ...item, type: item.type }];
			}

			state.total = getTotal(state.cart, state.envioExpress);
		},

		updateItemQuantity: (state, action) => {
			const { name, toppings, quantity } = action.payload;
			const existingItemIndex = state.cart.findIndex(
				(cartItem) =>
					cartItem.name === name &&
					JSON.stringify(cartItem.toppings) === JSON.stringify(toppings)
			);

			if (existingItemIndex >= 0) {
				// Reemplazar la cantidad existente con la nueva cantidad proporcionada
				state.cart[existingItemIndex].quantity = quantity;
				state.total = getTotal(state.cart);
			}
		},

		removeOneItem: (state, action) => {
			const index = action.payload;
			state.cart[index].quantity -= 1;
			state.total = getTotal(state.cart);
		},

		addOneItem: (state, action) => {
			const index = action.payload;
			state.cart[index].quantity += 1;
			state.total = getTotal(state.cart);
		},

		removeItem: (state, action) => {
			const index = action.payload;
			state.cart.splice(index, 1);
			state.total = getTotal(state.cart);
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
			state.total = getTotal(state.lastCart);
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
