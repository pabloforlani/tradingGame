const balanceInicial = 100.0;
let balance = balanceInicial;
let orders = [];
let closedOrders = [];
let closedPnL = 0; // Acumulador de PNL cerrado
let closedPnLPorc = 0; // Acumulador de PNL cerrado
let openPnL = 0;
let openPnLPorc = 0;
let totalPnL = 0;
let totalPnLPorc = 0;
let currentPrice;

async function fetchPrice() {
  try {
    const response = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
    );
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error("Error fetching price:", error);
    return null;
  }
}

function updatePrice(price) {
    currentPrice = parseFloat((price + Math.random() * 15).toFixed(2));
    
}

function updatePnL() {
  openPnL = 0;
  openPnLPorc = 0;
  orders.forEach((order, index) => {
    const pnl =
      order.type === "Buy"
        ? ((currentPrice - order.price) * order.leverage * order.investment) /
          order.price
        : ((order.price - currentPrice) * order.leverage * order.investment) /
          order.price;
    order.pnl = pnl;
    order.pnlPorc = (pnl * 100) / order.investment;

    openPnL += pnl;
    openPnLPorc += order.pnlPorc;
    totalPnL = openPnL + closedPnL;
    totalPnLPorc = (totalPnL * 100) / balanceInicial;

    if (
      (order.takeProfit != 0 &&
        (pnl / order.investment) * 100 >= order.takeProfit) ||
      (order.stopLoss != 0 && (-pnl / order.investment) * 100 >= order.stopLoss)
    ) {
      closeOrder(index);
    }

    if (pnl + order.investment <= 0) {
      closeOrder(index);
    }
  });

  if (balance <= 0 && orders.length == 0) {
    document.getElementById("reset-button").disabled = false;
  } else {
    document.getElementById("reset-button").disabled = true;
  }

  if (orders.length == 0) {
    openPnL = 0;
    openPnLPorc = 0;
  }

  //---------- seccion que actualiza el pnl en el html (PnL Section) -------------
  // document.getElementById("pnl").innerHTML = `<h3>Total PNL: ${totalPnL.toFixed(
  //   2
  // )} USDT | ${totalPnLPorc.toFixed(2)}%</h3>
  //            (Open: ${openPnL.toFixed(2)} | ${openPnLPorc.toFixed(
  //   2
  // )}% / Closed: ${closedPnL.toFixed(2)} | ${closedPnLPorc.toFixed(2)}%)`;
  // -------------------------------------------------------------------------

  renderOrders();
}

function renderOrders() {
  const ordersList = document.getElementById("orders-list");
  ordersList.innerHTML = "";
  orders
    .slice()
    .reverse()
    .forEach((order, index) => {
      const row = document.createElement("tr");
      row.className = order.pnl >= 0 ? "profit" : "loss";
      row.innerHTML = `
                    <td>${order.type}</td>
                    <td>${order.price.toFixed(2)}</td>
                    <td>${order.leverage}</td>
                    <td>${order.investment.toFixed(2)}</td>
                    <td>${order.takeProfit}%</td>
                    <td>${order.stopLoss}%</td>
                    <td>${order.pnl.toFixed(2)}</td>
                    <td>${order.pnlPorc.toFixed(2)}</td>
                    <td><button class="btn-close" onclick="closeOrder(${
                      orders.length - 1 - index
                    })">Close</button></td>
                `;
      ordersList.appendChild(row);
    });
}

function renderClosedOrders() {
  const closedOrdersList = document.getElementById("closed-orders-list");
  closedOrdersList.innerHTML = "";
  closedOrders
    .slice()
    .reverse()
    .forEach((order) => {
      const row = document.createElement("tr");
      row.className = order.pnl >= 0 ? "profit" : "loss";
      row.innerHTML = `
                    <td>${order.type}</td>
                    <td>${order.price.toFixed(2)}</td>
                    <td>${order.closePrice.toFixed(2)}</td>
                    <td>${order.leverage}</td>
                    <td>${order.investment.toFixed(2)}</td>
                    <td>${order.pnl.toFixed(2)}</td>
                    <td>${order.pnlPorc.toFixed(2)}</td>
                `;
      closedOrdersList.appendChild(row);
    });
}

function placeOrder(type) {
  if (!currentPrice) {
    return;
  }
  const leverage = parseInt(document.getElementById("leverage").value);
  const takeProfit =
    parseFloat(document.getElementById("take-profit").value) || 0;
  const stopLoss = parseFloat(document.getElementById("stop-loss").value) || 0;
  const investmentOption = document.getElementById("investment-option").value;
  let investment = parseFloat(
    document.getElementById("investment-amount").value
  );

  if (investmentOption === "percentage") {
    investment = (investment / 100) * balance;
  }

  if (investment > balance) {
    alert("Insufficient balance for this investment.");
    return;
  }

  if (!investment) {
    alert("put a value to investment, please!");
    return;
  }

  if (leverage > 125) {
    alert("the levereage can´t be upper than 125");
    document.getElementById("leverage").value = 125;
    return;
  }

  balance -= investment;

  orders.push({
    type,
    price: currentPrice,
    closePrice: 0,
    leverage,
    investment,
    takeProfit,
    stopLoss,
    pnl: 0,
    pnlPorc: 0,
  });
  renderOrders();
}

function closeOrder(index) {
  const order = orders[index];

  // Actualiza el acumulador de PNL cerrado
  closedPnL += order.pnl;
  closedPnLPorc += order.pnlPorc;

  //define precio de cierre
  order.closePrice = currentPrice;

  // Mueve la orden al historial de órdenes cerradas
  closedOrders.push(order);

  balance += order.investment + order.pnl;

  // Elimina la orden de la lista de abiertas
  orders.splice(index, 1);

  renderOrders();
  renderClosedOrders();
}

function closeAllOrders() {
  // Iterar sobre los índices en orden inverso
  for (let i = orders.length - 1; i >= 0; i--) {
    closeOrder(i);
  }
}

function resetBalance() {
  const confirmation = confirm("Are you sure you want to reset your balance?");
  if (confirmation) {
    balance = 100;;
  }
}

document
  .getElementById("buy-button")
  .addEventListener("click", () => placeOrder("Buy"));
document
  .getElementById("sell-button")
  .addEventListener("click", () => placeOrder("Sell"));
document
  .getElementById("reset-button")
  .addEventListener("click", () => resetBalance());
document
  .getElementById("close-all-orders")
  .addEventListener("click", closeAllOrders);

document.getElementById("1x-button").addEventListener("click", () => {
  zoom = 1;
  priceHistory = [];
  (async () => {
    priceHistory.push(...(await fetchPriceHistory()));
    drawChart();
  })();
});
document.getElementById("2x-button").addEventListener("click", () => {
  zoom = 2;
  priceHistory = [];
  (async () => {
    priceHistory.push(...(await fetchPriceHistory()));
    drawChart();
  })();
});
document.getElementById("4x-button").addEventListener("click", () => {
  zoom = 4;
  priceHistory = [];
  (async () => {
    priceHistory.push(...(await fetchPriceHistory()));
    drawChart();
  })();
});
document.getElementById("8x-button").addEventListener("click", () => {
  zoom = 8;
  priceHistory = [];
  (async () => {
    priceHistory.push(...(await fetchPriceHistory()));
    drawChart();
  })();
});

let priceHistory = [];
const canvas = document.getElementById("price-chart");
const ctx = canvas.getContext("2d");
let zoom = 1;

async function fetchPriceHistory() {
  const symbol = "BTCUSDT"; // Cambia este valor si usas otro par
  const interval = "1s"; // Velas de 1 segundo
  let limit = 1000 / zoom; // Últimos 1000 segundos

  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    const data = await response.json();
    return data.map((candle) => parseFloat(candle[4])); // Extrae el precio de cierre (índice 4)
  } catch (error) {
    console.error("Error fetching price history:", error);
    return [];
  }
}

// Variables para almacenar la posición del mouse
let mouseX = null;
let mouseY = null;
let mouseInside = false;

// Evento para rastrear la posición del mouse
canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = event.clientY - rect.top;
  mouseInside = true;

  drawChart(); // Redibujar el gráfico inmediatamente con la línea del mouse
});

// Evento para detectar cuando el mouse sale del gráfico
canvas.addEventListener("mouseleave", () => {
  mouseX = null;
  mouseY = null;
  mouseInside = false;

  drawChart(); // Redibujar el gráfico para eliminar la línea
});

function drawCanvasBackground() {
  ctx.fillStyle = "black"; // Cambia a cualquier color que desees
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawChart() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCanvasBackground();

  if (priceHistory.length === 0) return;

  const minPrice = Math.min(...priceHistory);
  const maxPrice = Math.max(...priceHistory);

  const marginTop = 20; // Margen superior en píxeles
  const marginBottom = 20; // Margen inferior en píxeles
  const chartHeight = canvas.height - marginTop - marginBottom; // Altura útil del gráfico

  // Ajustar la escala para incluir el margen superior
  const scaleY = (price) =>
    ((price - minPrice) / (maxPrice - minPrice)) * chartHeight + marginTop;

  // Draw price line
  ctx.beginPath();
  ctx.strokeStyle = "#007bff";
  ctx.lineWidth = 2;
  priceHistory.forEach((price, index) => {
    const x = (canvas.width / (priceHistory.length - 1)) * index;
    const y = canvas.height - scaleY(price);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Draw orders
  orders.forEach((order) => {
    let temp = 1;
    if (order.type == "Sell") {
      temp = -1;
    }
    const yOrder = canvas.height - scaleY(order.price);
    const yTakeProfit =
      canvas.height -
      scaleY(
        order.price * (1 + ((order.takeProfit / 100) * temp) / order.leverage)
      );
    const yStopLoss =
      canvas.height -
      scaleY(
        order.price * (1 - ((order.stopLoss / 100) * temp) / order.leverage)
      );
    //console.log(yTakeProfit, yOrder, yStopLoss, chartHeight, order.leverage)

    // Draw order price line
    ctx.strokeStyle = "#0000ff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, yOrder);
    ctx.lineTo(canvas.width, yOrder);
    ctx.stroke();

    if (order.takeProfit) {
      // Draw take profit line;
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]); // Dotted line
      ctx.beginPath();
      ctx.moveTo(0, yTakeProfit);
      ctx.lineTo(canvas.width, yTakeProfit);
      ctx.stroke();
    }

    if (order.stopLoss) {
      // Draw stop loss line
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]); // Dotted line
      ctx.beginPath();
      ctx.moveTo(0, yStopLoss);
      ctx.lineTo(canvas.width, yStopLoss);
      ctx.stroke();
    }

    ctx.setLineDash([]); // Reset line style
  });

  // Dibujar los valores de precio máximo y mínimo
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.textAlign = "right";
  ctx.fillText(maxPrice.toFixed(2), canvas.width - 5, marginTop); // Precio máximo
  ctx.fillText(
    minPrice.toFixed(2),
    canvas.width - 5,
    canvas.height - marginBottom + 15
  ); // Precio mínimo

  // Dibujar la línea del mouse si está dentro del gráfico
  if (
    mouseInside &&
    mouseY >= marginTop &&
    mouseY <= canvas.height - marginBottom
  ) {
    const price =
      maxPrice - ((mouseY - marginTop) / chartHeight) * (maxPrice - minPrice);

    // Dibujar la línea horizontal
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mouseY);
    ctx.lineTo(canvas.width, mouseY);
    ctx.stroke();

    // Dibujar el precio al inicio de la línea
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(price.toFixed(2), 5, mouseY - 5);
  }
}

function toggleOptions() {
  const optionsMenu = document.getElementById("options-menu");
  optionsMenu.style.display =
    optionsMenu.style.display === "block" ? "none" : "block";
}

function logout() {
  alert("Cerrar sesión aún no está configurado.");
}

// Actualizar Saldo y Precio en Header
function updateHeader() {
  document.getElementById("header-balance").textContent = `${balance.toFixed(
    2
  )} USDT`;
  document.getElementById("header-current-price").textContent = currentPrice || "Loading...";

  // Actualizar PNL
  
  document.getElementById("header-pnl").textContent = `${totalPnL.toFixed(2)} USDT`;
  document.getElementById("open-orders-pnl").textContent = openPnL.toFixed(2);
  document.getElementById("closed-orders-pnl").textContent = closedPnL.toFixed(2);
  document.getElementById("header-pnl-porc").textContent = `${totalPnLPorc.toFixed(2)} USDT`;
  document.getElementById("open-orders-pnl-porc").textContent = openPnLPorc.toFixed(2);
  document.getElementById("closed-orders-pnl-porc").textContent = closedPnLPorc.toFixed(2);
}

(async () => {
  priceHistory.push(...(await fetchPriceHistory()));
  drawChart();
})();

setInterval(async () => {
  const price = await fetchPrice();
  if (price) {
    updatePrice(price);
    updatePnL();
  }
}, 1000);

setInterval(() => {
  if (!isNaN(currentPrice)) {
    priceHistory.push(currentPrice);
    if (priceHistory.length > 1000) {
      priceHistory.shift(); // Keep the last 1000 prices
    }

    drawChart();

    updateHeader();
  }
}, 1000);
