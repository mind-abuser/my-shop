/**
 * СТРАНИЦА ОФОРМЛЕНИЯ ЗАКАЗА (checkout.html)
 * Показывает форму для заполнения данных покупателя
 * и резюме товаров из корзины.
 */

const ORDERS_KEY = "my_shop_orders_v1";

/**
 * Загружает сохранённые заказы из localStorage
 */
function loadOrders() {
  const raw = localStorage.getItem(ORDERS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Сохраняет заказы в localStorage
 */
function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

/**
 * Рисует список товаров в резюме заказа
 */
function renderOrderSummary() {
  const container = document.getElementById("orderItems");
  const totalSpan = document.getElementById("orderTotal");

  if (!container || !cart) {
    return;
  }

  // Собираем данные товаров из корзины
  const items = Object.entries(cart).map(([id, qty]) => {
    const p = window.PRODUCTS.find((x) => x.id === Number(id));
    return { ...p, qty };
  });

  // Если корзина пустая
  if (items.length === 0) {
    container.innerHTML = `<p class="small">Корзина пустая</p>`;
    if (totalSpan) totalSpan.textContent = "0";
    return;
  }

  // Рисуем товары
  container.innerHTML = items
    .map(
      (item) => `
        <div class="order-item">
          <div class="order-item-info">
            <b>${item.title}</b>
            <div class="small">${item.qty} × ${item.price} ₴</div>
          </div>
          <div class="order-item-total">
            <b>${item.price * item.qty} ₴</b>
          </div>
        </div>
      `
    )
    .join("");

  // Считаем сумму
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (totalSpan) totalSpan.textContent = String(total);
}

/**
 * Инициализирует форму оформления заказа
 */
function initCheckoutForm() {
  const form = document.getElementById("orderForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Проверяем, что корзина не пустая
    const count = Object.values(cart).reduce((a, b) => a + b, 0);
    if (count === 0) {
      alert("Корзина пустая 😊");
      return;
    }

    // Собираем данные формы
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const comments = document.getElementById("comments").value.trim();

    // Создаём объект заказа
    const order = {
      id: Date.now(),
      createdAt: new Date().toLocaleString("ru-RU"),
      customer: {
        firstName,
        lastName,
        email,
        phone,
        address,
        comments,
      },
      items: Object.entries(cart).map(([id, qty]) => {
        const p = window.PRODUCTS.find((x) => x.id === Number(id));
        return {
          id: p.id,
          title: p.title,
          price: p.price,
          qty,
          subtotal: p.price * qty,
        };
      }),
      total: Object.entries(cart).reduce(
        (sum, [id, qty]) => {
          const p = window.PRODUCTS.find((x) => x.id === Number(id));
          return sum + p.price * qty;
        },
        0
      ),
    };

    // Сохраняем заказ
    const orders = loadOrders();
    orders.push(order);
    saveOrders(orders);

    // Очищаем корзину
    window.cart = {};
    window.saveCart();

    // Показываем сообщение об успехе
    alert(
      `Спасибо, ${firstName}! Ваш заказ #${order.id} принят.\nНа почту ${email} отправлено подтверждение.`
    );

    // Переходим на главную или страницу заказов
    window.location.href = "index.html";
  });
}

/**
 * Инициализация страницы оформления
 */
function initCheckoutPage() {
  // Загружаем корзину
  if (window.loadCart) {
    window.cart = window.loadCart();
  }

  renderOrderSummary();
  initCheckoutForm();
}

// Запускаем при загрузке
document.addEventListener("DOMContentLoaded", initCheckoutPage);
