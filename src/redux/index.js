import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import thunk from 'redux-thunk';

import cart from '../redux/cart/cartSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['cartState'],
};

const rootReducer = combineReducers({
  cartState: cart,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: [thunk],
});

export default store;
