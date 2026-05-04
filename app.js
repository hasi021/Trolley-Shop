import { db, auth } from './firebase-config.js';
import { collection, getDocs, onSnapshot, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let cart = [];
let products = [];
let currentUser = null;

// Timer
function startTimer(){
  const end = new Date().setHours(23,59,59,999);
  setInterval(()=>{
    const now = new Date().getTime();
    const distance = end - now;
    const h = Math.floor(distance/(1000*60*60));
    const m = Math.floor((distance%(1000*60*60))/(1000*60));
    const s = Math.floor((distance%(1000*60))/1000);
    const el = document.getElementById('timer');
    if(el) el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  },1000);
}
startTimer();

// LOAD PRODUCTS FROM FIREBASE + DUMMY FALLBACK
async function loadProducts() {
  try {
    onSnapshot(collection(db, "products"), (snapshot) => {
      products = [];
      snapshot.forEach((doc) => {
        products.push({ id: doc.id,...doc.data() });
      });
      
      // Agar Firebase khali hai to dummy products
      if(products.length === 0) {
        products = [
          {id:1,name:"Trolley Smart Earbuds Pro",price:2499,oldPrice:4999,category:"electronics",image:"🎧",rating:4.6,stock:25,description:"ANC, 40hr Battery",sold:234},
          {id:2,name:"Trolley Fitness Band Max",price:3499,oldPrice:5999,category:"electronics",image:"⌚",rating:4.7,stock:18,description:"Heart Rate, SpO2",sold:189},
          {id:3,name:"Trolley Winter Jacket Premium",price:3999,oldPrice:6999,category:"fashion",image:"🧥",rating:4.5,stock:30,description:"Waterproof",sold:156},
          {id:4,name:"Trolley 4K Action Cam",price:12999,oldPrice:18999,category:"electronics",image:"📹",rating:4.8,stock:12,description:"4K 60fps",sold:98},
          {id:5,name:"Trolley Ergonomic Chair",price:8999,oldPrice:13999,category:"home",image:"🪑",rating:4.6,stock:15,description:"Lumbar Support",sold:145},
          {id:6,name:"Trolley Gaming Mouse RGB",price:1999,oldPrice:3499,category:"electronics",image:"🖱️",rating:4.4,stock:40,description:"12000 DPI",sold:312},
          {id:7,name:"Trolley Vitamin C Face Serum",price:899,oldPrice:1799,category:"beauty",image:"💧",rating:4.7,stock:60,description:"Brightening",sold:445},
          {id:8,name:"Trolley Yoga Mat Pro",price:1499,oldPrice:2999,category:"sports",image:"🧘",rating:4.5,stock:35,description:"6mm Thick",sold:267}
        ];
      }
      
      renderProducts(products);
      renderFlashProducts();
    });
  } catch(e) {
    console.log("Firebase error, using dummy products:", e);
    products = [
      {id:1,name:"Trolley Smart Earbuds Pro",price:2499,oldPrice:4999,category:"electronics",image:"🎧",rating:4.6,stock:25,description:"ANC, 40hr Battery",sold:234},
      {id:2,name:"Trolley Fitness Band Max",price:3499,oldPrice:5999,category:"electronics",image:"⌚",rating:4.7,stock:18,description:"Heart Rate, SpO2",sold:189},
      {id:3,name:"Trolley Winter Jacket Premium",price:3999,oldPrice:6999,category:"fashion",image:"🧥",rating:4.5,stock:30,description:"Waterproof",sold:156},
      {id:4,name:"Trolley 4K Action Cam",price:12999,oldPrice:18999,category:"electronics",image:"📹",rating:4.8,stock:12,description:"4K 60fps",sold:98}
    ];
    renderProducts(products);
    renderFlashProducts();
  }
}
loadProducts();

function renderProducts(list) {
  const grid = document.getElementById('productsGrid');
  if(!grid) return;
  grid.innerHTML = list.map(p => {
    const discount = p.oldPrice > p.price? Math.round((1 - p.price/p.oldPrice)*100) : 0;
    return `
    <div class="product-card">
      <div class="product-img">
        ${discount > 0? `<span class="product-badge">${discount}% OFF</span>` : ''}
        ${p.image}
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">Rs ${p.price} ${p.oldPrice > p.price? `<s>Rs ${p.oldPrice}</s>` : ''}</div>
        <div class="product-rating">⭐ ${p.rating} | ${p.sold || 0} sold</div>
        <button class="add-btn" onclick="addToCart('${p.id}')">Add to Cart</button>
      </div>
    </div>`;
  }).join('');
}

function renderFlashProducts() {
  const flash = document.getElementById('flashProducts');
  if(!flash) return;
  const flashItems = products.slice(0,6);
  flash.innerHTML = flashItems.map(p => {
    const discount = p.oldPrice > p.price? Math.round((1 - p.price/p.oldPrice)*100) : 0;
    return `
    <div class="product-h-card">
      <div class="product-h-img">
        ${discount > 0? `<span class="save-badge">SAVE ${discount}%</span>` : ''}
        ${p.image}
      </div>
      <div class="product-h-info">
        <div class="product-h-price">Rs ${p.price}</div>
        <div class="product-h-old">Rs ${p.oldPrice}</div>
        <div class="product-h-sold">🔥 ${p.sold || 0} sold</div>
      </div>
    </div>`;
  }).join('');
}

// CART FUNCTIONS
window.addToCart = function(id) {
  const product = products.find(p => p.id == id);
  if(!product || product.stock <= 0) return alert("Out of stock!");
  const existing = cart.find(item => item.id == id);
  if(existing) {
    if(existing.qty >= product.stock) return alert("Stock limit!");
    existing.qty++;
  } else cart.push({...product, qty: 1});
  updateCartCount();
  alert("Added to cart!");
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cartCount').textContent = count;
  const mobileCart = document.getElementById('cartCountMobile');
  if(mobileCart) mobileCart.textContent = count;
  const navCart = document.getElementById('cartCountNav');
  if(navCart) navCart.textContent = count;
}

window.openCart = function() {
  renderCart();
  document.getElementById('cartModal').classList.add('active');
}

window.closeCart = function() {
  document.getElementById('cartModal').classList.remove('active');
}

function renderCart() {
  const container = document.getElementById('cartItems');
  if(cart.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:40px;color:#666">Cart is empty</p>';
    document.getElementById('subtotalPrice').textContent = 0;
    document.getElementById('totalPrice').textContent = 0;
    return;
  }
  let subtotal = 0;
  container.innerHTML = cart.map(item => {
    subtotal += item.price * item.qty;
    return `
      <div class="cart-item">
        <div style="font-size:40px">${item.image}</div>
        <div class="cart-item-info">
          <strong>${item.name}</strong>
          <div style="color:#ff4757;font-weight:700">Rs ${item.price}</div>
          <div class="qty-control">
            <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
            <span>${item.qty}</span>
            <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
            <button class="qty-btn" style="background:#ff4757;margin-left:auto" onclick="removeFromCart('${item.id}')">🗑️</button>
          </div>
        </div>
      </div>`;
  }).join('');
  const delivery = subtotal >= 2000? 0 : 200;
  document.getElementById('subtotalPrice').textContent = subtotal;
  document.getElementById('deliveryPrice').textContent = delivery === 0? 'FREE' : `Rs ${delivery}`;
  document.getElementById('totalPrice').textContent = subtotal + delivery;
}

window.updateQty = function(id, change) {
  const item = cart.find(i => i.id == id);
  item.qty += change;
  if(item.qty <= 0) cart = cart.filter(i => i.id!= id);
  updateCartCount();
  renderCart();
}

window.removeFromCart = function(id) {
  cart = cart.filter(i => i.id!= id);
  updateCartCount();
  renderCart();
}

// CUSTOMER LOGIN SYSTEM
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  const loginBtn = document.getElementById('loginBtn');
  const loginBtnMobile = document.getElementById('loginBtnMobile');
  const loginBtnNav = document.getElementById('loginBtnNav');
  
  if(user) {
    if(loginBtn) loginBtn.textContent = '👤 ' + user.email.split('@')[0];
    if(loginBtnMobile) loginBtnMobile.onclick = logoutUser;
    if(loginBtnNav) loginBtnNav.innerHTML = '<span class="nav-icon">👤</span><span>Logout</span>';
    if(loginBtnNav) loginBtnNav.onclick = logoutUser;
  } else {
    if(loginBtn) loginBtn.textContent = '👤 Login';
    if(loginBtnMobile) loginBtnMobile.onclick = openLogin;
    if(loginBtnNav) loginBtnNav.innerHTML = '<span class="nav-icon">👤</span><span>Account</span>';
    if(loginBtnNav) loginBtnNav.onclick = openLogin;
  }
});

window.openLogin = function() {
  document.getElementById('loginModal').classList.add('active');
}

window.closeLogin = function() {
  document.getElementById('loginModal').classList.remove('active');
}

window.loginUser = async function() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if(!email ||!password) return alert('Please enter email and password');
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert('Login successful!');
    closeLogin();
  } catch(error) {
    alert('Login failed: ' + error.message);
  }
}

window.signupUser = async function() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if(!email ||!password) return alert('Please enter email and password');
  if(password.length < 6) return alert('Password must be 6+ characters');
  
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert('Account created successfully!');
    closeLogin();
  } catch(error) {
    alert('Signup failed: ' + error.message);
  }
}

window.logoutUser = async function() {
  await signOut(auth);
  alert('Logged out successfully!');
}

// Add click events to login buttons
document.getElementById('loginBtn')?.addEventListener('click', openLogin);
document.getElementById('loginBtnMobile')?.addEventListener('click', openLogin);
document.getElementById('loginBtnNav')?.addEventListener('click', openLogin);

// Filter Category
window.filterCategory = function(cat) {
  if(cat === 'all') {
    renderProducts(products);
  } else {
    const filtered = products.filter(p => p.category === cat);
    renderProducts(filtered);
  }
  document.getElementById('productsGrid').scrollIntoView({behavior:'smooth'});
}

// Search
window.searchProducts = function() {
  const query = document.getElementById('searchInputDesktop')?.value.toLowerCase() || document.getElementById('searchInput')?.value.toLowerCase();
  if(!query) return renderProducts(products);
  const filtered = products.filter(p => p.name.toLowerCase().includes(query));
  renderProducts(filtered);
}

// Place Order
window.placeOrder = async function() {
  const name = document.getElementById('customerName').value;
  const phone = document.getElementById('customerPhone').value;
  const city = document.getElementById('customerCity').value;
  const address = document.getElementById('customerAddress').value;
  
  if(!name ||!phone ||!city ||!address) return alert('Please fill all fields');
  if(cart.length === 0) return alert('Cart is empty');
  
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const delivery = subtotal >= 2000? 0 : 200;
  
  try {
    await addDoc(collection(db, "orders"), {
      customerName: name,
      customerPhone: phone,
      customerCity: city,
      customerAddress: address,
      items: cart,
      subtotal: subtotal,
      delivery: delivery,
      total: subtotal + delivery,
      status: 'Pending',
      orderDate: serverTimestamp(),
      userId: currentUser? currentUser.uid : 'guest'
    });
    
    alert('Order placed successfully! We will call you soon.');
    cart = [];
    updateCartCount();
    closeCart();
  } catch(error) {
    alert('Order failed: ' + error.message);
  }
}