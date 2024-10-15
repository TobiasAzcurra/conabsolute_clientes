import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

import thunk from "redux-thunk";

import cart from "../redux/cart/cartSlice";
import user from "../redux/user/userSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["cartState", "userState"],
};

const rootReducer = combineReducers({
  cartState: cart,
  userState: user, // Agrega el estado de usuario autenticado
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: [thunk],
});

export default store;
