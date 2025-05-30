(function() {
	'use strict';

	var tinyslider = function() {
		var el = document.querySelectorAll('.testimonial-slider');

		if (el.length > 0) {
			var slider = tns({
				container: '.testimonial-slider',
				items: 1,
				axis: "horizontal",
				controlsContainer: "#testimonial-nav",
				swipeAngle: false,
				speed: 700,
				nav: true,
				controls: true,
				autoplay: true,
				autoplayHoverPause: true,
				autoplayTimeout: 3500,
				autoplayButtonOutput: false
			});
		}
	};
	tinyslider();

	


	var sitePlusMinus = function() {

		var value,
    		quantity = document.getElementsByClassName('quantity-container');

		function createBindings(quantityContainer) {
	      var quantityAmount = quantityContainer.getElementsByClassName('quantity-amount')[0];
	      var increase = quantityContainer.getElementsByClassName('increase')[0];
	      var decrease = quantityContainer.getElementsByClassName('decrease')[0];
	      increase.addEventListener('click', function (e) { increaseValue(e, quantityAmount); });
	      decrease.addEventListener('click', function (e) { decreaseValue(e, quantityAmount); });
	    }

	    function init() {
	        for (var i = 0; i < quantity.length; i++ ) {
						createBindings(quantity[i]);
	        }
	    };

	    function increaseValue(event, quantityAmount) {
	        value = parseInt(quantityAmount.value, 10);

	        console.log(quantityAmount, quantityAmount.value);

	        value = isNaN(value) ? 0 : value;
	        value++;
	        quantityAmount.value = value;
	    }

	    function decreaseValue(event, quantityAmount) {
	        value = parseInt(quantityAmount.value, 10);

	        value = isNaN(value) ? 0 : value;
	        if (value > 0) value--;

	        quantityAmount.value = value;
	    }
	    
	    init();
		
	};
	sitePlusMinus();


})()
// custom.js - Production-ready cart system
class CartSystem {
  constructor() {
    this.cart = this.getSafeCart();
    this.handlers = {};
    this.init();
  }

  // Safe localStorage parsing
  getSafeCart() {
    try {
      return JSON.parse(localStorage.getItem('cart')) || [];
    } catch (error) {
      console.error('Cart parse error:', error);
      return [];
    }
  }

  init() {
    this.setupListeners();
    this.renderCart();
    this.toggleStates();
    this.updateCartCounter();
  }

  setupListeners() {
    // Cleanup existing listeners
    this.removeListeners?.();

    // Add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleAddToCart(e.target);
      });
    });

    // Cart actions
    this.handlers.cartAction = (e) => this.handleCartAction(e);
    document.addEventListener(`click`, this.handlers.cartAction);

    // Checkout button
    const checkoutBtn = document.querySelector(`.checkout-btn`);
    if (checkoutBtn) {
      this.handlers.checkout = () => this.handleCheckout();
      checkoutBtn.addEventListener(`click`, this.handlers.checkout);
    }
  }

  handleCartAction(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const index = parseInt(target.dataset.index, 10);

    switch (action) {
      case `increase`:
        this.updateQuantity(index, action);
        break;
      case `decrease`:
        this.updateQuantity(index, action);
        break;
      case `remove`:
        this.removeItem(index);
        break;
      default:
        console.warn(`Unknown action:`, action);
    }
  }

  async updateQuantity(index, action) {
    if (isNaN(index) || index < 0 || index >= this.cart.length) return;

    const item = this.cart[index];
    if (!item) return;

    if (action === 'increase') {
      item.quantity += 1;
    } else if (action === 'decrease' && item.quantity > 1) {
      item.quantity -= 1;
    }

    await this.saveCart();
    this.renderCart();
  }

  validateCartItem(item) {
    return Boolean(
      item?.id &&
      typeof item.name === 'string' &&
      Number.isFinite(item.price) &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
    );
  }

  async handleAddToCart(button) {
    const product = {
      id: button.dataset.id,
      name: button.dataset.name,
      price: parseFloat(button.dataset.price),
      image: button.dataset.image
    };

    const newItem = {
      id: String(product.id),
      name: this.sanitizeHTML(product.name),
      price: Number(product.price),
      image: product.image,
      quantity: 1
    };

    if (!this.validateCartItem(newItem)) {
      console.error('Invalid product:', product);
      return;
    }

    const existingIndex = this.cart.findIndex(item => item.id === newItem.id);
    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += 1;
    } else {
      this.cart.push(newItem);
    }

    await this.saveCart();
    this.updateCartCounter();
    this.showAddFeedback(button);
  }

  async saveCart() {
    return new Promise((resolve) => {
      try {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        resolve(true);
      } catch (error) {
        console.error('Cart save failed:', error);
        resolve(false);
      }
    });
  }

  renderCart() {
    const fragment = document.createDocumentFragment();
    
    this.cart.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${this.sanitizeHTML(item.image)}" 
             alt="${this.sanitizeHTML(item.name)}" 
             class="item-image"
             loading="lazy">
        <div>

		
<h3>${this.sanitizeHTML(item.name)}</h3>
          <p>$${item.price.toFixed(2)}</p>
        </div>
        <div class="quantity-controls">
          <button type="button" 
                  class="quantity-btn" 
                  data-action="decrease" 
                  data-index="${index}">-</button>
          <span>${item.quantity}</span>
          <button type="button" 
                  class="quantity-btn" 
                  data-action="increase" 
                  data-index="${index}">+</button>
        </div>
        <button type="button" 
                class="remove-btn" 
                data-action="remove" 
                data-index="${index}">&times;</button>`

      fragment.appendChild(div);
    });

    const container = document.getElementById('cartItems');
    if (container) {
      container.textContent = '';
      container.appendChild(fragment);
    }

    this.updateTotals();
    this.toggleStates();
  }

updateTotals() {
  // Calculate totals
  const subtotal = this.cart.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return sum + (price * quantity);
  }, 0);

  // Update DOM elements
  document.querySelectorAll('[data-subtotal]').forEach(el => {
    el.textContent = `$${subtotal.toFixed(2)}`;
  });
  
  document.querySelectorAll('[data-total]').forEach(el => {
    const total = subtotal; // Add shipping calculation here if needed
    el.textContent = `$${total.toFixed(2)}`;
  });

  // Update item count display
  const itemCount = this.cart.reduce((acc, item) => acc + item.quantity, 0);
  document.getElementById('cartStatus').textContent = 
    `${itemCount} ${itemCount === 1 ? `item` : `items`} in your cart`;
}

  toggleStates() {
    const isEmpty = this.cart.length === 0;
    const emptyCart = document.getElementById('emptyCart');
    const cartSummary = document.getElementById('cartSummary');
    const cartItems = document.getElementById('cartItems');

    if (emptyCart) emptyCart.style.display = isEmpty ? 'block' : 'none';
    if (cartSummary) cartSummary.style.display = isEmpty ? 'none' : 'block';
    if (cartItems) cartItems.style.display = isEmpty ? 'none' : 'grid';
  }

  updateCartCounter() {
    const counter = document.querySelector('.cart-counter');
    if (counter) {
      const count = this.cart.reduce((acc, item) => acc + item.quantity, 0);
      counter.textContent = count;
    }
  }

  showAddFeedback(button) {
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Added!';
    button.style.backgroundColor = '#3b5d50';
    
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.backgroundColor = '';
    }, 2000);
  }

  sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  }

  removeItem(index) {
    if (index >= 0 && index < this.cart.length) {
      this.cart.splice(index, 1);
      this.saveCart();
      this.renderCart();
      this.toggleStates();
    }
  }

  removeListeners() {
    document.removeEventListener('click', this.handlers.cartAction);
    document.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.removeEventListener('click', this.handlers.addToCart);
    });
    document.querySelector('.checkout-btn')?.removeEventListener('click', this.handlers.checkout);
  }

  handleCheckout() {
    window.location.href = 'checkout.html';
  }
}

// Initialize cart system after DOM load
document.addEventListener('DOMContentLoaded', () => {
  const cartSystem = new CartSystem();
});

// Checkout form handling
if (document.getElementById('checkoutForm')) {
  document.getElementById('checkoutForm').addEventListener('submit', function(e) {
    e.preventDefault();
    localStorage.removeItem('cart');
    alert('Thank you for your purchase!');
    window.location.href = 'index.html';
  });
}

/**
 * CART COUNTER MODULE - Works independently alongside existing cart system
 */
class CartCounter {
  constructor() {
    this.counterElement = document.querySelector('.cart-counter');
    if (!this.counterElement) return;
    
    this.init();
    this.bindEvents();
  }
  
  init() {
    this.updateCounter();
  }
  
  getCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    return cart.reduce((total, item) => total + (item.quantity || 0), 0);
  }
  
  updateCounter() {
    if (!this.counterElement) return;
    const count = this.getCartCount();
    this.counterElement.textContent = count;
    
    // Optional: Toggle visibility when empty
    this.counterElement.style.display = count > 0 ? 'flex' : 'none';
  }
  
  bindEvents() {
    // Listen for custom cart updates from your existing system
    document.addEventListener('cartUpdated', () => this.updateCounter());
    
    // Fallback: Periodic check (every 2 seconds)
    this.interval = setInterval(() => this.updateCounter(), 2000);
  }
  
  destroy() {
    clearInterval(this.interval);
    document.removeEventListener('cartUpdated', this.updateCounter);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new CartCounter();
});

// Cart Display Functionality
function displayCartItems() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartTable = document.querySelector('.site-block-order-table tbody');
  const subtotalElement = document.querySelector('[data-subtotal]');
  const totalElement = document.querySelector('[data-total]');
  
  if (!cartTable) return;

  // Clear existing rows (keep headers)
  cartTable.innerHTML = `
    <tr>
      <th>Product</th>
      <th>Total</th>
    </tr>
  `;

  let subtotal = 0;

  // Add each cart item to the table
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    cartTable.innerHTML += `
      <tr>
        <td>${item.name} <strong class="mx-2">x</strong> ${item.quantity}</td>
        <td>$${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  });

  // Add subtotal and total rows
  cartTable.innerHTML += `
    <tr>
      <td class="text-black font-weight-bold"><strong>Cart Subtotal</strong></td>
      <td class="text-black">$${subtotal.toFixed(2)}</td>
    </tr>
    <tr>
      <td class="text-black font-weight-bold"><strong>Order Total</strong></td>
      <td class="text-black font-weight-bold"><strong>$${subtotal.toFixed(2)}</strong></td>
    </tr>
  `;

  // Update any subtotal/total displays
  if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  if (totalElement) totalElement.textContent = `$${subtotal.toFixed(2)}`;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  displayCartItems();
  
  // Add click handler for Place Order button
  document.querySelector('.btn-block')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('cart'); // Clear cart on order placement
    window.location.href = 'thankyou.html';
  });
});

  (function() {
    function onTidioChatApiReady() {
      // below is the list which starts the abandoned cart process. If some of the steps will be missed, and the visitor doesn't land on the page given in "checkoutFinished" - abandoned cart will be triggered.
      var checkoutSteps = [
        "https://erste-websites.github.io/demo/cart.html", // checkout step 1
        "https://erste-websites.github.io/demo/checkout.html", // checkout step 2
      ];
      // below is the list which clears the abandon cart process without triggering it
      var checkoutFinished = [
        "https://erste-websites.github.io/demo/thankyou.html" // the purchase page
      ];
      // do not modify the code below
      function executeTidioChatApiTrack() {
        tidioChatApi.track("Abandoned Cart");
      }

      function checkUrl(e) {
        var t = "tidioStartUrlVisited",
          i = getCookie(t),
          o = e.replace(/\/$/, "");
        if (-1 < checkoutSteps.indexOf(e) || -1 < checkoutSteps.indexOf(o))
          return setCookie(t, "1", "10"), !0;
        i &&
          1 == +i &&
          -1 === checkoutFinished.indexOf(e) &&
          -1 === checkoutFinished.indexOf(o) &&
          executeTidioChatApiTrack(),
          setCookie(t, "", -1);
      }

      function setCookie(e, t, i) {
        var o = new Date();
        o.setTime(o.getTime() + 24 * i * 60 * 60 * 1e3);
        var n = "expires=" + o.toUTCString();
        document.cookie = e + "=" + t + ";" + n + ";path=/";
      }

      function getCookie(e) {
        for (
          var t = e + "=",
            i = decodeURIComponent(document.cookie).split(";"),
            o = 0; o < i.length; o += 1
        ) {
          for (var n = i[o];
            " " == n.charAt(0);) n = n.substring(1);
          if (0 == n.indexOf(t)) return n.substring(t.length, n.length);
        }
        return "";
      }
      var i, o;
      checkUrl(document.location.href),
        (i = window.history),
        (o = i.pushState),
        (i.pushState = function(e) {
          "function" == typeof i.onpushstate && i.onpushstate({
            state: e
          });
          var t = o.apply(i, arguments);
          return checkUrl(document.location.href), t;
        });
    }
    if (window.tidioChatApi) {
      window.tidioChatApi.on("ready", onTidioChatApiReady);
    } else {
      document.addEventListener("tidioChat-ready", onTidioChatApiReady);
    }
  })();

