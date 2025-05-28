Basim, [5/28/2025 4:39 PM]
// custom.js - Clean, production-ready cart system with abandoned cart trigger

class CartSystem { constructor() { this.cart = this.getSafeCart(); this.handlers = {}; this.init(); }

getSafeCart() { try { return JSON.parse(localStorage.getItem('cart')) || []; } catch (error) { console.error('Cart parse error:', error); return []; } }

init() { this.setupListeners(); this.renderCart(); this.toggleStates(); this.updateCartCounter(); this.triggerAbandonedCart(); }

setupListeners() { this.removeListeners?.();

document.querySelectorAll('.add-to-cart').forEach(btn => {
  btn.addEventListener('click', (e) => this.handleAddToCart(e.target));
});

this.handlers.cartAction = (e) => this.handleCartAction(e);
document.addEventListener('click', this.handlers.cartAction);

const checkoutBtn = document.querySelector('.checkout-btn');
if (checkoutBtn) {
  this.handlers.checkout = () => this.handleCheckout();
  checkoutBtn.addEventListener('click', this.handlers.checkout);
}

}

handleCartAction(e) { const target = e.target.closest('[data-action]'); if (!target) return;

const action = target.dataset.action;
const index = parseInt(target.dataset.index, 10);

switch (action) {
  case 'increase':
  case 'decrease':
    this.updateQuantity(index, action);
    break;
  case 'remove':
    this.removeItem(index);
    break;
}

}

async updateQuantity(index, action) { if (isNaN(index)  index < 0  index >= this.cart.length) return;

const item = this.cart[index];
if (!item) return;

if (action === 'increase') item.quantity++;
else if (action === 'decrease' && item.quantity > 1) item.quantity--;

await this.saveCart();
this.renderCart();

}

validateCartItem(item) { return item?.id && typeof item.name === 'string' && Number.isFinite(item.price) && Number.isInteger(item.quantity) && item.quantity > 0; }

async handleAddToCart(button) { const product = { id: button.dataset.id, name: button.dataset.name, price: parseFloat(button.dataset.price), image: button.dataset.image };

const newItem = {
  id: String(product.id),
  name: this.sanitizeHTML(product.name),
  price: Number(product.price),
  image: product.image,
  quantity: 1
};

if (!this.validateCartItem(newItem)) return;

const existingIndex = this.cart.findIndex(item => item.id === newItem.id);
if (existingIndex > -1) this.cart[existingIndex].quantity++;
else this.cart.push(newItem);

await this.saveCart();
this.updateCartCounter();
this.showAddFeedback(button);

}

async saveCart() { try { localStorage.setItem('cart', JSON.stringify(this.cart)); } catch (error) { console.error('Cart save failed:', error); } }

renderCart() { const container = document.getElementById('cartItems'); if (!container) return;

container.textContent = '';
this.cart.forEach((item, index) => {
  const div = document.createElement('div');
  div.className = 'cart-item';
  div.innerHTML = 
    <img src="${this.sanitizeHTML(item.image)}" alt="${this.sanitizeHTML(item.name)}">
    <div>
      <h3>${this.sanitizeHTML(item.name)}</h3>
      <p>$${item.price.toFixed(2)}</p>
    </div>
    <div class="quantity-controls">
      <button data-action="decrease" data-index="${index}">-</button>
      <span>${item.quantity}</span>
      <button data-action="increase" data-index="${index}">+</button>
    </div>
    <button data-action="remove" data-index="${index}">&times;</button>;
  container.appendChild(div);
});

this.updateTotals();
this.toggleStates();

}

updateTotals() { const subtotal = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0); document.querySelectorAll('[data-subtotal]').forEach(el => el.textContent = $${subtotal.toFixed(2)}); document.querySelectorAll('[data-total]').forEach(el => el.textContent = $${subtotal.toFixed(2)}); const itemCount = this.cart.reduce((count, item) => count + item.quantity, 0); const status = document.getElementById('cartStatus'); if (status) status.textContent = ${itemCount} ${itemCount === 1 ? 'item' : 'items'} in your cart; }

Basim, [5/28/2025 4:39 PM]
toggleStates() { const isEmpty = this.cart.length === 0; ['emptyCart', 'cartSummary', 'cartItems'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = (id === 'emptyCart' && isEmpty) || (id !== 'emptyCart' && !isEmpty) ? 'block' : 'none'; }); }

updateCartCounter() { const count = this.cart.reduce((sum, item) => sum + item.quantity, 0); const counter = document.querySelector('.cart-counter'); if (counter) counter.textContent = count; }

showAddFeedback(button) { const original = button.innerHTML; button.innerHTML = '<i class="fas fa-check"></i> Added!'; button.classList.add('added'); setTimeout(() => { button.innerHTML = original; button.classList.remove('added'); }, 2000); }

sanitizeHTML(str) { const temp = document.createElement('div'); temp.textContent = str; return temp.innerHTML; }

removeItem(index) { if (index >= 0 && index < this.cart.length) { this.cart.splice(index, 1); this.saveCart(); this.renderCart(); } }

removeListeners() { document.removeEventListener('click', this.handlers.cartAction); document.querySelectorAll('.add-to-cart').forEach(btn => { btn.removeEventListener('click', this.handlers.addToCart); }); document.querySelector('.checkout-btn')?.removeEventListener('click', this.handlers.checkout); }

handleCheckout() { window.location.href = 'checkout.html'; }

triggerAbandonedCart() { if (this.cart.length === 0) return; const timestamp = new Date().toISOString(); localStorage.setItem('abandonedCart', JSON.stringify({ cart: this.cart, timestamp }));

if (typeof TidioChatApi !== 'undefined') {
  TidioChatApi.setVisitorData({
    abandonedCart: this.cart.map(({ name, price, quantity }) => ${name} x${quantity} ($${price})).join(', '),
    timestamp: timestamp
  });
}

} }

document.addEventListener('DOMContentLoaded', () => new CartSystem());

// Checkout form const checkoutForm = document.getElementById('checkoutForm'); if (checkoutForm) { checkoutForm.addEventListener('submit', (e) => { e.preventDefault(); localStorage.removeItem('cart'); localStorage.removeItem('abandonedCart'); alert('Thank you for your purchase!'); window.location.href = 'index.html'; }); }
