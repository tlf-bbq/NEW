let cartItems = [];
let tipPercent = 0;
let tipCustomAmount = 0;
let promoAmount = 0;
let initialHomeMarkup = "";

function initCarousel() {
  const track = document.querySelector(".carousel-track");
  const slides = document.querySelectorAll(".carousel-img");
  if (!track || slides.length === 0) return;

  let index = 0;
  const totalSlides = slides.length;

  function goToSlide(nextIndex) {
    index = (nextIndex + totalSlides) % totalSlides;
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  const nextBtn = document.querySelector(".carousel-btn.next");
  const prevBtn = document.querySelector(".carousel-btn.prev");

  nextBtn?.addEventListener("click", () => goToSlide(index + 1));
  prevBtn?.addEventListener("click", () => goToSlide(index - 1));

  let intervalId = setInterval(() => goToSlide(index + 1), 4000);
  const carousel = track.closest(".carousel");

  function restartInterval() {
    clearInterval(intervalId);
    intervalId = setInterval(() => goToSlide(index + 1), 4000);
  }

  carousel?.addEventListener("mouseenter", () => clearInterval(intervalId));
  carousel?.addEventListener("mouseleave", restartInterval);
}

function isMobileMenuOpen() {
  return document.getElementById("slideout")?.classList.contains("menu-open");
}

function closeMobileMenu() {
  const slideout = document.getElementById("slideout");
  if (!slideout) return;
  slideout.classList.remove("menu-open");
  slideout.style.right = "-260px";
}

function openMobileMenu() {
  const slideout = document.getElementById("slideout");
  if (!slideout) return;
  slideout.classList.add("menu-open");
  slideout.style.right = "0";
}

function initMobileMenu() {
  const hamburger = document.getElementById("hamburger");
  const closeBtn = document.getElementById("closeBtn");
  const slideout = document.getElementById("slideout");
  if (!hamburger || !closeBtn || !slideout) return;

  hamburger.addEventListener("click", (event) => {
    event.preventDefault();
    if (isMobileMenuOpen()) {
      closeMobileMenu();
    } else {
      openMobileMenu();
      slideout.querySelector("a, button")?.focus();
    }
  });

  closeBtn.addEventListener("click", (event) => {
    event.preventDefault();
    closeMobileMenu();
    hamburger.focus();
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !isMobileMenuOpen()) return;
    if (!slideout.contains(target) && !hamburger.contains(target)) {
      closeMobileMenu();
    }
  });
}

let parallaxTicking = false;
window.addEventListener("scroll", () => {
  if (parallaxTicking) return;

  parallaxTicking = true;
  window.requestAnimationFrame(() => {
    const hero = document.querySelector(".hero");
    if (hero) {
      hero.style.transform = `translateY(${window.scrollY * 0.57}px)`;
    }
    parallaxTicking = false;
  });
});

function getNavHeight() {
  const nav = document.getElementById("nav") || document.querySelector(".navbar") || document.querySelector("header");
  return nav ? nav.offsetHeight : 0;
}

function applyDynamicContentLayout() {
  const dynamic = document.getElementById("dynamic-content");
  if (!dynamic) return;

  const navHeight = getNavHeight();
  dynamic.classList.add("menu-offset");
  dynamic.style.paddingTop = navHeight ? `${navHeight}px` : "";
}

function finalizeDynamicContentSwap() {
  closeMobileMenu();
  applyDynamicContentLayout();
  syncMenuCardQuantities();

  const navHeight = getNavHeight();
  const dynamic = document.getElementById("dynamic-content");
  if (!dynamic) return;

  requestAnimationFrame(() => {
    const rect = dynamic.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const targetTop = rect.top + scrollTop - navHeight;
    window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
  });
}

function updateDynamicContent(templateId, transitionDuration = 220) {
  const dynamic = document.getElementById("dynamic-content");
  const template = document.getElementById(templateId);
  if (!dynamic || !template) return;

  dynamic.classList.remove("fade-in");
  dynamic.classList.add("fade-out");

  window.setTimeout(() => {
    dynamic.innerHTML = "";
    dynamic.appendChild(template.content.cloneNode(true));
    dynamic.classList.remove("fade-out");
    dynamic.classList.add("fade-in");
    finalizeDynamicContentSwap();
  }, transitionDuration);
}

function showAboutPage() {
  updateDynamicContent("about-page-template");
}

function showHomePage() {
  const dynamic = document.getElementById("dynamic-content");
  if (!dynamic || !initialHomeMarkup) return;

  dynamic.classList.remove("fade-in");
  dynamic.classList.add("fade-out");

  window.setTimeout(() => {
    dynamic.innerHTML = initialHomeMarkup;
    dynamic.classList.remove("fade-out");
    dynamic.classList.add("fade-in");
    finalizeDynamicContentSwap();
  }, 180);
}

function loadMenu() {
  updateDynamicContent("menu-template", 180);
}

function getSubtotal() {
  return cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function getTotal() {
  const subtotal = getSubtotal();
  const tip = tipCustomAmount > 0 ? tipCustomAmount : subtotal * tipPercent;
  const promo = Math.min(promoAmount, subtotal + tip);
  const total = Math.max(0, subtotal + tip - promo);
  return { subtotal, tip, promo, total };
}

function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function resetMenuCardQty(itemName) {
  document.querySelectorAll(".add-btn").forEach((button) => {
    if (button.dataset.item !== itemName) return;
    const card = button.closest(".menu-item");
    const qtySpan = card?.querySelector(".qty-number");
    if (qtySpan) qtySpan.textContent = "1";
  });
}

function syncMenuCardQuantities() {
  const quantities = Object.fromEntries(cartItems.map((item) => [item.name, item.qty]));

  document.querySelectorAll(".add-btn").forEach((button) => {
    const card = button.closest(".menu-item");
    const qtySpan = card?.querySelector(".qty-number");
    if (!qtySpan) return;
    qtySpan.textContent = String(quantities[button.dataset.item] || 1);
  });
}

function updateCartDisplay() {
  const list = document.getElementById("cart-list");
  const totalBox = document.getElementById("cart-total");
  const subtotalDisplay = document.getElementById("subtotal-display");
  const tipDisplay = document.getElementById("tip-display");
  const promoDisplay = document.getElementById("promo-display");
  const emptyMessage = document.getElementById("cart-empty-msg");
  const count = document.getElementById("cart-count");

  let totalItems = 0;

  if (list) {
    list.innerHTML = "";

    cartItems.forEach((item, index) => {
      totalItems += item.qty;
      const lineTotal = item.price * item.qty;
      const row = document.createElement("li");
      row.className = "cart-row";
      row.innerHTML = `
        <span class="cart-title">${escapeHtml(item.name)}</span>
        <div class="cart-controls">
          <button class="qty-btn cart-minus" data-index="${index}" aria-label="Decrease quantity of ${escapeHtml(item.name)}">-</button>
          <span class="qty" aria-live="polite">${item.qty}</span>
          <button class="qty-btn cart-plus" data-index="${index}" aria-label="Increase quantity of ${escapeHtml(item.name)}">+</button>
          <span class="cart-price">$${lineTotal.toFixed(2)}</span>
          <button class="delete-btn" data-index="${index}" aria-label="Remove ${escapeHtml(item.name)} from cart">x</button>
        </div>
      `;
      list.appendChild(row);
    });
  } else {
    totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);
  }

  if (emptyMessage) {
    emptyMessage.style.display = cartItems.length === 0 ? "block" : "none";
  }

  if (count) {
    count.textContent = String(totalItems);
  }

  const totals = getTotal();
  if (subtotalDisplay) subtotalDisplay.textContent = `$${totals.subtotal.toFixed(2)}`;
  if (tipDisplay) tipDisplay.textContent = `$${totals.tip.toFixed(2)}`;
  if (promoDisplay) promoDisplay.textContent = `-$${totals.promo.toFixed(2)}`;
  if (totalBox) totalBox.textContent = `$${totals.total.toFixed(2)}`;

  syncMenuCardQuantities();
}

function setCartQty(name, price, qty) {
  const numericPrice = Number.parseFloat(price);
  if (!name || Number.isNaN(numericPrice)) return;

  const existingIndex = cartItems.findIndex((item) => item.name === name);

  if (existingIndex >= 0) {
    if (qty <= 0) {
      cartItems.splice(existingIndex, 1);
      resetMenuCardQty(name);
    } else {
      cartItems[existingIndex].qty = qty;
    }
  } else if (qty > 0) {
    cartItems.push({ name, price: numericPrice, qty });
  }

  updateCartDisplay();
}

function openCheckoutDrawer() {
  const drawer = document.getElementById("checkout-drawer");
  const backdrop = document.getElementById("checkout-backdrop");
  if (!drawer || !backdrop) return;

  drawer.classList.add("open");
  backdrop.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeCheckoutDrawer() {
  const drawer = document.getElementById("checkout-drawer");
  const backdrop = document.getElementById("checkout-backdrop");
  if (!drawer || !backdrop) return;

  drawer.classList.remove("open");
  backdrop.classList.remove("open");
  document.body.style.overflow = "";
}

const WEB3FORMS_URL = "https://api.web3forms.com/submit";
const WEB3FORMS_ACCESS_KEY = "";
const FORM_REQUEST_TIMEOUT_MS = 10000;
const EMAIL_TEST_QUERY_PARAM = "emailtest";

function getTrimmedInputValue(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function shouldShowEmailTestTools() {
  try {
    return new URLSearchParams(window.location.search).get(EMAIL_TEST_QUERY_PARAM) === "1";
  } catch (error) {
    console.warn("Could not read email test query flag.", error);
    return false;
  }
}

function buildCurrentOrderPayload(options = {}) {
  const { isTest = false, paypalCaptureId = null } = options;
  const totals = getTotal();

  return {
    name: getTrimmedInputValue("cust-name"),
    phone: getTrimmedInputValue("cust-phone"),
    customerEmail: getTrimmedInputValue("cust-email"),
    notificationEmail: getTrimmedInputValue("notify-email"),
    pickupDate: getTrimmedInputValue("pickup-date"),
    pickupTime: getTrimmedInputValue("pickup-time"),
    notes: getTrimmedInputValue("order-notes"),
    items: cartItems.map((item) => ({ ...item })),
    subtotal: totals.subtotal,
    tip: totals.tip,
    promo: totals.promo,
    total: totals.total,
    paypalCaptureId,
    isTest
  };
}

function validateOrderPayload(order, options = {}) {
  const { isTest = false } = options;

  if (!order.items || order.items.length === 0) {
    alert("Add items to cart first!");
    openCheckoutDrawer();
    return false;
  }

  if (!order.name || !order.phone || !order.customerEmail || !order.pickupDate || !order.pickupTime) {
    alert("Please fill in your name, phone number, email, pickup date, and pickup time before continuing.");
    return false;
  }

  if (!isValidEmail(order.customerEmail)) {
    alert("Please enter a valid customer email address.");
    return false;
  }

  if (order.notificationEmail && !isValidEmail(order.notificationEmail)) {
    alert("Please enter a valid extra order email address or leave it blank.");
    return false;
  }

  if (!isTest && !order.paypalCaptureId) {
    alert("Payment must be completed before the order email is sent.");
    return false;
  }

  return true;
}

function showOrderSentConfirmation(options = {}) {
  const recipients = [];

  if (options.customerEmail) {
    recipients.push(`customer copy: ${options.customerEmail}`);
  }

  if (options.notificationEmail) {
    recipients.push(`extra copy: ${options.notificationEmail}`);
  }

  const modeLabel = options.isTest ? "Test order" : "Order";
  const details = recipients.length
    ? `\n\nRequested recipient emails:\n${recipients.join("\n")}`
    : "";

  alert(`${modeLabel} email sent to TLF BBQ.${details}`);
}

async function submitOrderWithWeb3Forms(order) {
  const accessKey = WEB3FORMS_ACCESS_KEY.trim();
  if (!accessKey) {
    alert("Add your Web3Forms access key in JSDAD.js before sending order emails.");
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FORM_REQUEST_TIMEOUT_MS);
  const itemsList = order.items
    .map((item) => `${item.qty}x ${item.name} - $${(item.price * item.qty).toFixed(2)}`)
    .join("\n");
  const orderId = `TLF-${Date.now()}`;

  try {
    const response = await fetch(WEB3FORMS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `${order.isTest ? "TEST - " : ""}New BBQ Order - ${order.name || "Customer"}`,
        from_name: "TLF BBQ Online Orders",
        name: order.name || "",
        phone: order.phone || "",
        email: order.customerEmail || "",
        replyto: order.customerEmail || "",
        ccemail: order.notificationEmail || undefined,
        items: itemsList,
        subtotal: `$${(order.subtotal || 0).toFixed(2)}`,
        tip: `$${(order.tip || 0).toFixed(2)}`,
        promo: `-$${(order.promo || 0).toFixed(2)}`,
        total: `$${(order.total || 0).toFixed(2)}`,
        pickup: `${order.pickupDate || ""} ${order.pickupTime || ""}`.trim(),
        notes: order.notes || "None",
        orderId,
        customerEmail: order.customerEmail || "N/A",
        notificationEmail: order.notificationEmail || "None",
        paypalCaptureId: order.paypalCaptureId || "N/A",
        botcheck: ""
      }),
      signal: controller.signal
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) {
      throw new Error(result.message || `Web3Forms request failed with status ${response.status}.`);
    }

    showOrderSentConfirmation(order);
    return true;
  } catch (error) {
    console.error("Web3Forms error:", error);
    alert(`Order email could not be sent: ${error.message}`);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sendCheckoutEmailsForCurrentOrder(options = {}) {
  const order = buildCurrentOrderPayload(options);
  if (!validateOrderPayload(order, options)) {
    return false;
  }

  return submitOrderWithWeb3Forms(order);
}

async function testOrderNotification() {
  return sendCheckoutEmailsForCurrentOrder({ isTest: true });
}

function resetCheckoutStateAfterSuccess() {
  cartItems.forEach((item) => resetMenuCardQty(item.name));
  cartItems = [];
  tipPercent = 0;
  tipCustomAmount = 0;
  promoAmount = 0;
  updateCartDisplay();
}

function showPrePayConfirmation() {
  const dynamic = document.getElementById("dynamic-content");
  const orderPreview = buildCurrentOrderPayload();

  if (!dynamic || !validateOrderPayload(orderPreview, { isTest: true })) {
    return;
  }

  let cartHTML = `<ul class="confirm-cart-list">`;
  orderPreview.items.forEach((item) => {
    const lineTotal = item.price * item.qty;
    cartHTML += `
      <li class="confirm-cart-item">
        <span>${escapeHtml(item.name)}</span>
        <span>${item.qty} x $${item.price.toFixed(2)}</span>
        <span>$${lineTotal.toFixed(2)}</span>
      </li>`;
  });
  cartHTML += `<li class="confirm-cart-item"><span>Tip</span><span></span><span>$${orderPreview.tip.toFixed(2)}</span></li>`;
  cartHTML += `<li class="confirm-cart-item"><span>Promo</span><span></span><span>-$${orderPreview.promo.toFixed(2)}</span></li>`;
  cartHTML += `<li class="confirm-cart-total"><strong>Total: $${orderPreview.total.toFixed(2)}</strong></li></ul>`;

  dynamic.innerHTML = `
    <div class="confirmation-screen animate-in">
      <div class="confirm-box-wrapper">
        <h1>Confirm Your Order</h1>
        <div class="confirm-box">
          <p><strong>Name:</strong> ${escapeHtml(orderPreview.name)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(orderPreview.phone)}</p>
          <p><strong>Customer Email:</strong> ${escapeHtml(orderPreview.customerEmail)}</p>
          <p><strong>Extra Order Email:</strong> ${escapeHtml(orderPreview.notificationEmail || "None")}</p>
          <p><strong>Pickup Date:</strong> ${escapeHtml(orderPreview.pickupDate)}</p>
          <p><strong>Pickup Time:</strong> ${escapeHtml(orderPreview.pickupTime)}</p>
          <p><strong>Notes:</strong> ${escapeHtml(orderPreview.notes || "None")}</p>
        </div>
        <h2>Order Contents</h2>
        ${cartHTML}
        <button class="cancel-btn" id="go-back-menu-btn">Back to Menu</button>
        <div class="confirm-pay-section">
          <div id="paypal-button-container"></div>
          ${shouldShowEmailTestTools() ? '<button id="test-email-btn" class="test-email-btn" type="button">Send Test Order Email</button>' : ""}
        </div>
      </div>
    </div>`;

  closeCheckoutDrawer();

  const testEmailBtn = document.getElementById("test-email-btn");
  if (testEmailBtn) {
    testEmailBtn.addEventListener("click", async () => {
      testEmailBtn.disabled = true;
      await testOrderNotification();
      testEmailBtn.disabled = false;
    });
  }

  if (typeof paypal === "undefined") {
    const container = document.getElementById("paypal-button-container");
    if (container) {
      container.innerHTML = "<p>PayPal is currently unavailable.</p>";
    }
    return;
  }

  paypal.Buttons({
    style: { color: "white", shape: "pill", layout: "vertical", tagline: false },
    createOrder: (data, actions) => {
      const orderTotal = Math.max(0.01, orderPreview.total).toFixed(2);
      return actions.order.create({
        purchase_units: [{ amount: { value: orderTotal } }]
      });
    },
    onApprove: async (data, actions) => {
      const container = document.getElementById("paypal-button-container");
      if (container) {
        container.style.pointerEvents = "none";
      }

      try {
        const capture = await actions.order.capture();
        const emailSent = await sendCheckoutEmailsForCurrentOrder({
          isTest: false,
          paypalCaptureId: capture?.id || null
        });

        if (!emailSent) {
          alert("Payment was captured, but the order email could not be sent. Please contact TLF BBQ with your pickup details.");
          return;
        }

        resetCheckoutStateAfterSuccess();
      } catch (error) {
        console.error("Payment or email sending failed:", error);
        alert("Payment failed or order confirmation could not be sent. Please try again.");
      } finally {
        if (container) {
          container.style.pointerEvents = "";
        }
      }
    },
    onError: (error) => {
      console.error("PayPal error:", error);
      alert("PayPal payment could not be initialized. Please try again.");
    }
  }).render("#paypal-button-container");
}

window.showPrePayConfirmation = showPrePayConfirmation;
window.testOrderNotification = testOrderNotification;

function initTipAndPromo() {
  const tipButtons = document.querySelectorAll(".tip-btn");
  const customTip = document.getElementById("tip-custom");
  const promoInput = document.getElementById("promo-code");
  const applyPromo = document.getElementById("apply-promo");

  tipButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tipButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      tipPercent = Number.parseFloat(button.dataset.tip) || 0;
      tipCustomAmount = 0;
      if (customTip) customTip.value = "";
      updateCartDisplay();
    });
  });

  customTip?.addEventListener("input", () => {
    const value = Number.parseFloat(customTip.value);
    if (customTip.value === "") {
      tipCustomAmount = 0;
      tipPercent = 0;
      updateCartDisplay();
      return;
    }

    if (!Number.isNaN(value) && value >= 0) {
      tipCustomAmount = value;
      tipPercent = 0;
      tipButtons.forEach((item) => item.classList.remove("active"));
      updateCartDisplay();
    }
  });

  applyPromo?.addEventListener("click", () => {
    const code = promoInput?.value.trim().toUpperCase() || "";
    const subtotal = getSubtotal();

    if (code === "BBQ10" && subtotal >= 50) {
      promoAmount = 10;
      alert('Promo code "BBQ10" applied!');
    } else if (code === "BBQ5" && subtotal >= 25) {
      promoAmount = 5;
      alert('Promo code "BBQ5" applied!');
    } else {
      promoAmount = 0;
      if (code) alert("Promo code not recognized or minimum spending not met.");
    }

    updateCartDisplay();
  });
}

function switchMenuTab(tab) {
  document.querySelectorAll(".tab").forEach((button) => button.classList.remove("active"));
  document.querySelectorAll(".menu-grid").forEach((grid) => grid.classList.add("hidden"));
  tab.classList.add("active");
  document.getElementById(tab.dataset.category)?.classList.remove("hidden");
}

function initNavigation() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest("#aboutNav") || target.closest("#aboutSlide")) {
      event.preventDefault();
      showAboutPage();
      return;
    }

    if (target.closest("#homeLogo")) {
      event.preventDefault();
      showHomePage();
      return;
    }

    if (
      target.closest("#menuNav")
      || target.closest("#menuSlide")
      || target.closest("#viewMenusBtn")
      || target.closest("#heroReserve")
      || target.closest("#navReserve")
    ) {
      event.preventDefault();
      loadMenu();
    }
  }, true);
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  if (target.matches(".tab")) {
    event.preventDefault();
    switchMenuTab(target);
    return;
  }

  if (target.matches(".qty-btn-card.qty-plus")) {
    event.preventDefault();
    const card = target.closest(".menu-item");
    const qtySpan = card?.querySelector(".qty-number");
    const nextQty = Math.max(1, (Number.parseInt(qtySpan?.textContent || "1", 10) || 1) + 1);
    if (qtySpan) qtySpan.textContent = String(nextQty);
    return;
  }

  if (target.matches(".qty-btn-card.qty-minus")) {
    event.preventDefault();
    const card = target.closest(".menu-item");
    const qtySpan = card?.querySelector(".qty-number");
    const nextQty = Math.max(1, (Number.parseInt(qtySpan?.textContent || "1", 10) || 1) - 1);
    if (qtySpan) qtySpan.textContent = String(nextQty);
    return;
  }

  if (target.matches(".add-btn")) {
    event.preventDefault();
    const card = target.closest(".menu-item");
    const qty = Math.max(1, Number.parseInt(card?.querySelector(".qty-number")?.textContent || "1", 10) || 1);
    setCartQty(target.dataset.item, target.dataset.price, qty);
    openCheckoutDrawer();
    return;
  }

  if (target.id === "clear-cart") {
    event.preventDefault();
    cartItems.forEach((item) => resetMenuCardQty(item.name));
    cartItems = [];
    updateCartDisplay();
    return;
  }

  if (target.matches(".cart-plus")) {
    const index = Number.parseInt(target.dataset.index || "", 10);
    if (cartItems[index]) {
      cartItems[index].qty += 1;
      updateCartDisplay();
    }
    return;
  }

  if (target.matches(".cart-minus")) {
    const index = Number.parseInt(target.dataset.index || "", 10);
    if (!cartItems[index]) return;

    if (cartItems[index].qty > 1) {
      cartItems[index].qty -= 1;
    } else {
      const [removed] = cartItems.splice(index, 1);
      if (removed) resetMenuCardQty(removed.name);
    }

    updateCartDisplay();
    return;
  }

  if (target.matches(".delete-btn")) {
    const index = Number.parseInt(target.dataset.index || "", 10);
    const removed = cartItems[index];
    if (removed) {
      cartItems.splice(index, 1);
      resetMenuCardQty(removed.name);
      updateCartDisplay();
    }
    return;
  }

  if (target.id === "go-back-menu-btn") {
    event.preventDefault();
    loadMenu();
    openCheckoutDrawer();
    return;
  }

  if (target.id === "open-checkout" || target.closest("#open-checkout")) {
    event.preventDefault();
    openCheckoutDrawer();
    return;
  }

  if (target.id === "close-checkout" || target.id === "checkout-backdrop") {
    event.preventDefault();
    closeCheckoutDrawer();
    return;
  }

  if (target.id === "review-order-btn") {
    event.preventDefault();
    if (typeof showPrePayConfirmation === "function") {
      showPrePayConfirmation();
    } else {
      alert("Checkout is still loading. Please try again in a moment.");
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const dynamic = document.getElementById("dynamic-content");
  if (dynamic) {
    initialHomeMarkup = dynamic.innerHTML;
  }

  initCarousel();
  initMobileMenu();
  initNavigation();
  initTipAndPromo();
  applyDynamicContentLayout();
  updateCartDisplay();
});
