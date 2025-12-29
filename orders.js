/**
 * СТРАНИЦА ИСТОРИИ ЗАКАЗОВ (orders.html)
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
 * Рисует список всех заказов
 */
function renderOrdersList() {
  const container = document.getElementById("ordersList");
  if (!container) return;

  const orders = loadOrders();

  // Если заказов нет
  if (orders.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <p class="small">У вас пока нет заказов</p>
        <a href="index.html" class="btn-link">← Вернуться к покупкам</a>
      </div>
    `;
    return;
  }

  // Рисуем заказы (новые сверху)
  container.innerHTML = orders
    .reverse()
    .map(
      (order) => `
        <div class="order-card">
          <div class="order-card-header">
            <div>
              <b>Заказ #${order.id}</b>
              <div class="small">${order.createdAt}</div>
            </div>
            <div class="order-status">
              <b>${order.total} ₴</b>
            </div>
          </div>

          <div class="order-card-customer">
            <p class="small">
              <b>${order.customer.firstName} ${order.customer.lastName}</b><br/>
              ${order.customer.email}<br/>
              ${order.customer.phone}
            </p>
          </div>

          <div class="order-card-items">
            ${order.items
              .map(
                (item) => `
                  <div class="order-item">
                    <div class="order-item-info">
                      <b>${item.title}</b>
                      <div class="small">${item.qty} × ${item.price} ₴</div>
                    </div>
                    <div class="order-item-total">
                      <b>${item.subtotal} ₴</b>
                    </div>
                  </div>
                `
              )
              .join("")}
          </div>

          ${
            order.customer.comments
              ? `
            <div class="order-card-comments">
              <b>Комментарий:</b> ${order.customer.comments}
            </div>
          `
              : ""
          }

          <div class="order-card-address">
            <b>Адрес:</b><br/>
            ${order.customer.address}
          </div>
        </div>
      `
    )
    .join("");
}

/**
 * Инициализация страницы заказов
 */
function initOrdersPage() {
  renderOrdersList();
}

// Запускаем при загрузке
document.addEventListener("DOMContentLoaded", initOrdersPage);
