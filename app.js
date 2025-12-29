/* =========================================================
   ДАННЫЕ (товары)
   ========================================================= */

// Список товаров приходит из products.js (мы кладём его в window.PRODUCTS)
const products = window.PRODUCTS;

/* =========================================================
   ХРАНЕНИЕ КОРЗИНЫ (localStorage)
   ========================================================= */

const CART_KEY = "my_shop_cart_v1";
let cart = {}; // Формат: { [productId]: qty }

function saveCart() {
  // Сохраняем объект cart в localStorage как строку
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function loadCart() {
  // Загружаем корзину из localStorage и пытаемся превратить обратно в объект
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    // Мини-проверка: ожидаем объект
    if (parsed && typeof parsed === "object") return parsed;
  } catch (e) {
    // Если JSON битый — игнорируем и возвращаем пустую корзину
  }

  return {};
}

/* =========================================================
   DOM-ЭЛЕМЕНТЫ (ищем элементы на странице)
   ========================================================= */

// Главная (каталог)
const grid = document.getElementById("productsGrid");

// Корзина (есть на index.html и product.html)
const cartBtn = document.getElementById("cartBtn");
const cartModal = document.getElementById("cartModal");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");

// Фильтры (есть только на index.html)
const searchInput = document.getElementById("searchInput");
const minPriceInput = document.getElementById("minPrice");
const maxPriceInput = document.getElementById("maxPrice");
const sortSelect = document.getElementById("sortSelect");
const resetFiltersBtn = document.getElementById("resetFilters");
const foundCount = document.getElementById("foundCount");

/* =========================================================
   ФИЛЬТРЫ И СОРТИРОВКА (только главная)
   ========================================================= */

/**
 * Возвращает список товаров с учётом поиска/фильтра/сортировки.
 * Если мы не на главной странице (нет searchInput и т.д.), то вернёт все товары.
 */
function getFilteredProducts() {
  let list = [...products];

  const q = (searchInput?.value || "").trim().toLowerCase();
  const minP = Number(minPriceInput?.value || "");
  const maxP = Number(maxPriceInput?.value || "");
  const sort = sortSelect?.value || "default";

  // Фильтр по названию
  if (q) {
    list = list.filter((p) => p.title.toLowerCase().includes(q));
  }

  // Фильтр по цене
  if (!Number.isNaN(minP) && minPriceInput?.value !== "") {
    list = list.filter((p) => p.price >= minP);
  }
  if (!Number.isNaN(maxP) && maxPriceInput?.value !== "") {
    list = list.filter((p) => p.price <= maxP);
  }

  // Сортировка
  if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
  if (sort === "title_asc") list.sort((a, b) => a.title.localeCompare(b.title, "ru"));
  if (sort === "title_desc") list.sort((a, b) => b.title.localeCompare(a.title, "ru"));

  return list;
}

/**
 * Подписывает события на поля фильтрации.
 * Если элементов фильтров нет (мы не на главной) — просто ничего не делает.
 */
function initFilters() {
  if (!searchInput) return; // значит мы не на главной

  const rerender = () => renderProducts();

  searchInput.addEventListener("input", rerender);
  minPriceInput.addEventListener("input", rerender);
  maxPriceInput.addEventListener("input", rerender);
  sortSelect.addEventListener("change", rerender);

  resetFiltersBtn.addEventListener("click", () => {
    searchInput.value = "";
    minPriceInput.value = "";
    maxPriceInput.value = "";
    sortSelect.value = "default";
    renderProducts();
  });
}

/* =========================================================
   РЕНДЕР (рисование) КАТАЛОГА (главная)
   ========================================================= */

/**
 * Рисует карточки товаров на главной странице.
 * Если сетки товаров нет (мы не на index.html) — ничего не делает.
 */
function renderProducts() {
  if (!grid) return;

  const list = getFilteredProducts();

  // Показываем "Найдено: N" (если этот блок существует)
  if (foundCount) {
    foundCount.textContent = String(list.length);
  }

  // Рисуем карточки
  grid.innerHTML = list
    .map(
      (p) => `
        <a href="product.html?id=${p.id}" style="text-decoration:none;color:inherit;">
          <div class="card">
            <div class="img"></div>
            <h3 class="title">${p.title}</h3>
            <div class="row">
              <div class="price">${p.price} ₴</div>
              <button class="primary" data-add="${p.id}">В корзину</button>
            </div>
            <div class="small">ID товара: ${p.id}</div>
          </div>
        </a>
      `
    )
    .join("");

  // Подписываем клики "В корзину"
  // Важно: кнопка внутри <a>, поэтому отменяем переход по ссылке
  grid.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault(); // отменяем переход по ссылке
      e.stopPropagation(); // не даём клику всплыть до <a>
      addToCart(Number(btn.dataset.add));
    });
  });
}

/* =========================================================
   СТРАНИЦА ТОВАРА (product.html)
   ========================================================= */

/**
 * Достаёт id товара из URL: product.html?id=3 -> вернёт 3
 */
function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  return id ? Number(id) : null;
}

/**
 * Рисует страницу конкретного товара (product.html).
 * Если контейнера нет — значит мы не на странице товара.
 */
function renderProductPage() {
  const container = document.getElementById("productContainer");
  if (!container) return;

  const productId = getProductIdFromUrl();
  const product = products.find((p) => p.id === productId);

  if (!product) {
    container.innerHTML = "<p>Товар не найден</p>";
    return;
  }

  container.innerHTML = `
    <div class="card" style="max-width:500px;">
      <div class="img" style="height:220px;"></div>
      <h2 class="title">${product.title}</h2>
      <p class="small">${product.description}</p>
      <p class="price">${product.price} ₴</p>
      <button class="primary" id="addToCartBtn">В корзину</button>
    </div>
  `;

  // Кнопка "В корзину" на странице товара
  document.getElementById("addToCartBtn").addEventListener("click", () => {
    addToCart(product.id);
    alert("Товар добавлен в корзину");
  });
}

/* =========================================================
   КОРЗИНА (логика)
   ========================================================= */

/**
 * Добавляет 1 штуку товара в корзину
 */
function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateCartUI();
}

/**
 * Убирает 1 штуку товара из корзины
 */
function removeOne(id) {
  if (!cart[id]) return;

  cart[id] -= 1;
  if (cart[id] <= 0) delete cart[id];

  saveCart();
  updateCartUI();
}

/**
 * Обновляет UI корзины:
 * - счётчик возле кнопки корзины
 * - список товаров в модалке
 * - общую сумму
 *
 * Если элементов корзины на странице нет — ничего не делает.
 */
function updateCartUI() {
  if (!cartCount || !cartItems || !cartTotal) return;

  // Общее количество товаров (сумма qty)
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  cartCount.textContent = String(count);

  // Собираем массив items с данными товара + qty
  const items = Object.entries(cart).map(([id, qty]) => {
    const p = products.find((x) => x.id === Number(id));
    return { ...p, qty };
  });

  // Считаем общую сумму
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  cartTotal.textContent = String(total);

  // Если корзина пустая — показываем текст
  if (items.length === 0) {
    cartItems.innerHTML = `<p class="small">Корзина пустая.</p>`;
    return;
  }

  // Рисуем товары в корзине
  cartItems.innerHTML = items
    .map(
      (item) => `
        <div class="cart-item">
          <div>
            <b>${item.title}</b>
            <div class="small">${item.price} ₴ за шт.</div>
          </div>
          <div class="qty-controls">
            <button data-minus="${item.id}">−</button>
            <b>${item.qty}</b>
            <button data-plus="${item.id}">+</button>
          </div>
        </div>
      `
    )
    .join("");

  // Подписываем кнопки +/-
  cartItems.querySelectorAll("[data-plus]").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(Number(btn.dataset.plus)));
  });
  cartItems.querySelectorAll("[data-minus]").forEach((btn) => {
    btn.addEventListener("click", () => removeOne(Number(btn.dataset.minus)));
  });
}

/* =========================================================
   МОДАЛКА КОРЗИНЫ (открыть/закрыть) + ОФОРМЛЕНИЕ
   ========================================================= */

/**
 * Подписывает события на модалку корзины.
 * Если каких-то элементов нет (на какой-то странице) — просто ничего не делает.
 */
function initCartModal() {
  if (!cartBtn || !cartModal || !closeCart) return;

  cartBtn.addEventListener("click", () => cartModal.classList.remove("hidden"));
  closeCart.addEventListener("click", () => cartModal.classList.add("hidden"));

  // Клик по тёмному фону закрывает модалку
  cartModal.addEventListener("click", (e) => {
    if (e.target === cartModal) cartModal.classList.add("hidden");
  });
}

/**
 * Подписывает кнопку "Оформить заказ".
 * Переводит на страницу оформления (checkout.html).
 */
function initCheckout() {
  if (!checkoutBtn) return;

  checkoutBtn.addEventListener("click", () => {
    const count = Object.values(cart).reduce((a, b) => a + b, 0);

    if (count === 0) {
      alert("Корзина пустая 🙂");
      return;
    }

    // Переходим на страницу оформления заказа
    window.location.href = "checkout.html";
  });
}

/* =========================================================
   ИНИЦИАЛИЗАЦИЯ (что запускать при загрузке страницы)
   ========================================================= */

cart = loadCart();

renderProducts();     // если мы на index.html — нарисует каталог
initFilters();        // если мы на index.html — включит фильтры

renderProductPage();  // если мы на product.html — нарисует страницу товара

initCartModal();      // на страницах, где есть корзина
initCheckout();       // на страницах, где есть кнопка "Оформить"

updateCartUI();       // обновляет счётчик/сумму/список (где возможно)
