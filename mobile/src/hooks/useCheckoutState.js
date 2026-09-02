import { useReducer, useCallback } from 'react';

export const CHECKOUT_ACTION_TYPES = {
  // Cart operations
  SET_CART: 'SET_CART',
  ADD_TO_CART: 'ADD_TO_CART',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  CLEAR_CART: 'CLEAR_CART',

  // Customer selection
  SET_CUSTOMER: 'SET_CUSTOMER',
  SET_CUSTOMER_SEARCH: 'SET_CUSTOMER_SEARCH',
  SET_CUSTOMER_MODAL: 'SET_CUSTOMER_MODAL',

  // Payment & Numpad
  SET_PAYMENT_METHOD: 'SET_PAYMENT_METHOD',
  SET_PAID_AMOUNT: 'SET_PAID_AMOUNT',
  APPEND_NUMPAD_DIGIT: 'APPEND_NUMPAD_DIGIT',
  BACKSPACE_NUMPAD: 'BACKSPACE_NUMPAD',
  CLEAR_NUMPAD: 'CLEAR_NUMPAD',
  SET_CHECKOUT_LOADING: 'SET_CHECKOUT_LOADING',

  // Promo / Voucher
  SET_APPLIED_PROMO: 'SET_APPLIED_PROMO',
  SET_DISCOUNT: 'SET_DISCOUNT',
  SET_VOUCHER_INPUT: 'SET_VOUCHER_INPUT',
  SET_VOUCHER_LOADING: 'SET_VOUCHER_LOADING',
  REMOVE_PROMO: 'REMOVE_PROMO',
  SET_PROMO_MODAL: 'SET_PROMO_MODAL',

  // Taxes & Fees
  SET_SELECTED_TAX_ID: 'SET_SELECTED_TAX_ID',
  SET_SELECTED_MANUAL_FEES: 'SET_SELECTED_MANUAL_FEES',
  TOGGLE_MANUAL_FEE: 'TOGGLE_MANUAL_FEE',
  SET_IS_TAKEAWAY: 'SET_IS_TAKEAWAY',
  SET_TAX_MODAL: 'SET_TAX_MODAL',

  // Views & Modals
  SET_CHECKOUT_VIEW: 'SET_CHECKOUT_VIEW',
  SET_CART_MODAL: 'SET_CART_MODAL',
  SET_COMPLETED_TX: 'SET_COMPLETED_TX',
  SET_RECEIPT_MODAL: 'SET_RECEIPT_MODAL',

  // Atomic Reset
  RESET_CHECKOUT: 'RESET_CHECKOUT',
  NEW_TRANSACTION: 'NEW_TRANSACTION',
};

export const initialCheckoutState = {
  cart: [],
  isCheckoutView: false,
  cartModalOpen: false,
  paidAmount: '',
  selectedCustomer: null,
  customerModalOpen: false,
  customerSearch: '',
  paymentMethod: 'CASH',
  checkoutLoading: false,

  appliedPromo: null,
  discount: 0,
  voucherInput: '',
  voucherLoading: false,
  promoModalOpen: false,

  selectedTaxId: '',
  taxModalOpen: false,
  selectedManualFeeIds: [],
  isTakeaway: false,

  completedTx: null,
  receiptModalOpen: false,
};

export function checkoutReducer(state, action) {
  switch (action.type) {
    case CHECKOUT_ACTION_TYPES.SET_CART:
      return { ...state, cart: typeof action.payload === 'function' ? action.payload(state.cart) : action.payload };

    case CHECKOUT_ACTION_TYPES.ADD_TO_CART: {
      const product = action.payload;
      const existing = state.cart.find((item) => item.product.id === product.id);
      const availableStock = parseFloat(product.stock) || 0;
      if (existing) {
        if (existing.quantity >= availableStock) return state;
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      return { ...state, cart: [...state.cart, { product, quantity: 1 }] };
    }

    case CHECKOUT_ACTION_TYPES.UPDATE_QUANTITY: {
      const { productId, delta } = action.payload;
      return {
        ...state,
        cart: state.cart
          .map((item) => {
            if (item.product.id === productId) {
              const newQty = item.quantity + delta;
              const availableStock = parseFloat(item.product.stock) || 0;
              if (newQty > availableStock) return item;
              return { ...item, quantity: newQty };
            }
            return item;
          })
          .filter((item) => item.quantity > 0),
      };
    }

    case CHECKOUT_ACTION_TYPES.REMOVE_FROM_CART:
      return {
        ...state,
        cart: state.cart.filter((item) => item.product.id !== action.payload),
      };

    case CHECKOUT_ACTION_TYPES.CLEAR_CART:
      return { ...state, cart: [] };

    case CHECKOUT_ACTION_TYPES.SET_CUSTOMER:
      return { ...state, selectedCustomer: action.payload, customerModalOpen: false, customerSearch: '' };

    case CHECKOUT_ACTION_TYPES.SET_CUSTOMER_SEARCH:
      return { ...state, customerSearch: action.payload };

    case CHECKOUT_ACTION_TYPES.SET_CUSTOMER_MODAL:
      return { ...state, customerModalOpen: action.payload };

    case CHECKOUT_ACTION_TYPES.SET_PAYMENT_METHOD:
      return { ...state, paymentMethod: action.payload };

    case CHECKOUT_ACTION_TYPES.SET_PAID_AMOUNT:
      return { ...state, paidAmount: typeof action.payload === 'function' ? action.payload(state.paidAmount) : action.payload };

    case CHECKOUT_ACTION_TYPES.APPEND_NUMPAD_DIGIT: {
      const digit = action.payload;
      const current = (state.paidAmount || '').toString().trim();
      let nextVal = current;
      if (!current || current === '0') {
        nextVal = digit === '00' ? '0' : digit;
      } else if (current.length < 10) {
        nextVal = current + digit;
      }
      return { ...state, paidAmount: nextVal };
    }

    case CHECKOUT_ACTION_TYPES.BACKSPACE_NUMPAD: {
      const current = (state.paidAmount || '').toString().trim();
      const nextVal = current.length <= 1 ? '' : current.slice(0, -1);
      return { ...state, paidAmount: nextVal };
    }

    case CHECKOUT_ACTION_TYPES.CLEAR_NUMPAD:
      return { ...state, paidAmount: '' };

    case CHECKOUT_ACTION_TYPES.SET_CHECKOUT_LOADING:
      return { ...state, checkoutLoading: action.payload };

    case CHECKOUT_ACTION_TYPES.SET_APPLIED_PROMO:
      return {
        ...state,
        appliedPromo: action.payload.promo,
        discount: action.payload.discount || 0,
        voucherInput: '',
        promoModalOpen: false,
      };

    case CHECKOUT_ACTION_TYPES.SET_DISCOUNT:
      return { ...state, discount: action.payload };

    case CHECKOUT_ACTION_TYPES.SET_VOUCHER_INPUT:
      return { ...state, voucherInput: action.payload };

    case CHECKOUT_ACTION_TYPES.SET_VOUCHER_LOADING:
      return { ...state, voucherLoading: action.payload };

    case CHECKOUT_ACTION_TYPES.REMOVE_PROMO:
      return { ...state, appliedPromo: null, discount: 0, voucherInput: '' };

    case CHECKOUT_ACTION_TYPES.SET_PROMO_MODAL:
      return { ...state, promoModalOpen: action.payload };

    case CHECKOUT_ACTION_TYPES.SET_SELECTED_TAX_ID:
      return { ...state, selectedTaxId: action.payload };

    case CHECKOUT_ACTION_TYPES.SET_SELECTED_MANUAL_FEES:
      return { ...state, selectedManualFeeIds: action.payload };

    case CHECKOUT_ACTION_TYPES.TOGGLE_MANUAL_FEE: {
      const feeId = action.payload;
      const current = state.selectedManualFeeIds || [];
      const next = current.includes(feeId) ? current.filter((id) => id !== feeId) : [...current, feeId];
      return { ...state, selectedManualFeeIds: next };
    }

    case CHECKOUT_ACTION_TYPES.SET_IS_TAKEAWAY:
      return { ...state, isTakeaway: action.payload };

    case CHECKOUT_ACTION_TYPES.SET_TAX_MODAL:
      return { ...state, taxModalOpen: action.payload };

    case CHECKOUT_ACTION_TYPES.SET_CHECKOUT_VIEW:
      return { ...state, isCheckoutView: action.payload };

    case CHECKOUT_ACTION_TYPES.SET_CART_MODAL:
      return { ...state, cartModalOpen: action.payload };

    case CHECKOUT_ACTION_TYPES.SET_COMPLETED_TX:
      return { ...state, completedTx: action.payload };

    case CHECKOUT_ACTION_TYPES.SET_RECEIPT_MODAL:
      return { ...state, receiptModalOpen: action.payload };

    case CHECKOUT_ACTION_TYPES.RESET_CHECKOUT: {
      const { defaultTaxId = '', defaultFeeIds = [], completedTx = null } = action.payload || {};
      return {
        ...state,
        cart: [],
        paidAmount: '',
        selectedCustomer: null,
        appliedPromo: null,
        discount: 0,
        voucherInput: '',
        isTakeaway: false,
        selectedTaxId: defaultTaxId || state.selectedTaxId,
        selectedManualFeeIds: defaultFeeIds.length > 0 ? defaultFeeIds : state.selectedManualFeeIds,
        cartModalOpen: false,
        isCheckoutView: false,
        completedTx: completedTx || state.completedTx,
        receiptModalOpen: Boolean(completedTx),
      };
    }

    case CHECKOUT_ACTION_TYPES.NEW_TRANSACTION:
      return {
        ...state,
        isCheckoutView: false,
        receiptModalOpen: false,
        completedTx: null,
      };

    default:
      return state;
  }
}

export function useCheckoutReducer(initialOverrides = {}) {
  const [state, dispatch] = useReducer(checkoutReducer, {
    ...initialCheckoutState,
    ...initialOverrides,
  });

  return [state, dispatch];
}

export default useCheckoutReducer;
