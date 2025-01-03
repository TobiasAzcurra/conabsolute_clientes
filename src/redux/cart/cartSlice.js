import { createSlice } from "@reduxjs/toolkit";

const getTotal = (cart) => {
	let total = 0;
	let totalToppings = 0;
	cart.forEach(({ price, quantity, toppings }) => {
		total += price * quantity;
		toppings.forEach(({ price }) => {
			totalToppings += price * quantity;
		});
	});
	return total + totalToppings;
};

export const cartSlices = createSlice({
	name: "products",
	initialState: {
		cart: [],
		lastCart: [],
		total: 0,
	},

	reducers: {
		addItem: (state, action) => {
			const item = action.payload;
			const existingItemIndex = state.cart.findIndex(
				(cartItem) =>
					cartItem.name === item.name &&
					JSON.stringify(cartItem.toppings) === JSON.stringify(item.toppings)
			);

			if (existingItemIndex >= 0) {
				// Sumar la cantidad a la existente (acumulativa)
				state.cart[existingItemIndex].quantity += item.quantity;
			} else {
				// Agregar un nuevo artículo, incluyendo la propiedad 'type'
				state.cart = [...state.cart, { ...item, type: item.type }];
			}

			state.total = getTotal(state.cart);
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
} = cartSlices.actions;

export default cartSlices.reducer;
