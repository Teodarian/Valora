const STORAGE_KEY = "venderaPhase2Data";
const REGISTRY_KEY = "venderaCompanyRegistry";
const ACTIVE_COMPANY_KEY = "venderaActiveCompanyId";

const OLD_STORAGE_KEY = "valoraPhase2Data";
const OLD_REGISTRY_KEY = "valoraCompanyRegistry";
const OLD_ACTIVE_COMPANY_KEY = "valoraActiveCompanyId";

const defaultData = {
  isLoggedIn: false,
  company: {
    id: "",
    name: "",
    school: "",
  },
  user: {
    name: "",
    email: "",
  },
  employees: [],
  contacts: [],
  products: [],
  sales: [],
  purchases: [],
  sponsors: [],
  budget: {
    expectedSales: 0,
    expectedSponsors: 0,
    expectedPurchases: 0,
    expectedOtherCosts: 0,
  },
};

const editState = {
  employeeId: null,
  contactId: null,
  productId: null,
  saleId: null,
  purchaseId: null,
  sponsorId: null,
};

let registry = loadRegistry();
let companyToDeleteId = null;
let data = loadData();

const welcomeScreen = document.querySelector("#welcome-screen");
const loginScreen = document.querySelector("#login-screen");
const registerScreen = document.querySelector("#register-screen");
const adminScreen = document.querySelector("#admin-screen");
const app = document.querySelector("#app");

const pageTitle = document.querySelector("#page-title");
const pageDescription = document.querySelector("#page-description");

const pageInfo = {
  dashboard: {
    title: "Oversikt",
    description: "Se nøkkeltall og siste aktivitet.",
  },
  employees: {
    title: "Ansatte",
    description: "Administrer medlemmer og roller.",
  },
  contacts: {
    title: "Kontakter",
    description:
      "Hold oversikt over kunder, leverandører, sponsorer og samarbeidspartnere.",
  },
  products: {
    title: "Produkter",
    description: "Hold oversikt over produkter, tjenester, priser og lager.",
  },
  sales: {
    title: "Salg",
    description: "Registrer salg og inntekter.",
  },
  purchases: {
    title: "Innkjøp",
    description: "Registrer innkjøp og utgifter.",
  },
  budget: {
    title: "Budsjett",
    description: "Sammenlign forventede tall med faktisk resultat.",
  },
  sponsors: {
    title: "Sponsorer",
    description: "Hold oversikt over sponsoravtaler.",
  },
  reports: {
    title: "Rapporter",
    description: "Se en enkel oppsummering av bedriften.",
  },
  settings: {
    title: "Innstillinger",
    description: "Endre informasjon om elevbedriften.",
  },
};

function cloneDefaultData() {
  return structuredClone(defaultData);
}

function getCookieValue(name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

async function apiRequest(url, options = {}) {
  const csrfToken = getCookieValue("vendera_csrf_token");
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
      ...(options.headers || {}),
    },
    ...options,
  });
  let responseData = {};
  try { responseData = await response.json(); } catch { responseData = {}; }
  if (!response.ok) throw new Error(responseData.error || "Noe gikk galt med serveren.");
  return responseData;
}

function hydrateSessionData(sessionData) {
  const existingCompanyData = sessionData.company?.id
    ? getCompanyById(sessionData.company.id)
    : null;

  data = migrateData({
    ...cloneDefaultData(),
    ...(existingCompanyData || {}),
    company: {
      ...defaultData.company,
      ...((existingCompanyData && existingCompanyData.company) || {}),
      ...(sessionData.company || {}),
    },
    user: {
      ...defaultData.user,
      ...((existingCompanyData && existingCompanyData.user) || {}),
      ...(sessionData.user || {}),
    },
  });

  data.employees = Array.isArray(sessionData.employees)
    ? sessionData.employees.map((employee) => ({
        ...employee,
        email: employee.email || "",
      }))
    : [];
  data.contacts = Array.isArray(sessionData.contacts)
    ? sessionData.contacts.map((contact) => ({
        ...contact,
        contact: contact.contact || "",
        email: contact.email || "",
        phone: contact.phone || "",
        notes: contact.notes || "",
      }))
    : [];
  data.products = Array.isArray(sessionData.products)
    ? sessionData.products.map((product) => ({
        ...product,
        description: product.description || "",
        category: product.category || "",
        price: Number(product.price || 0),
        cost: Number(product.cost || 0),
        stock: Number(product.stock || 0),
      }))
    : [];
  data.purchases = Array.isArray(sessionData.purchases)
    ? sessionData.purchases.map((purchase) => ({
        ...purchase,
        amount: Number(purchase.amount || 0),
        date: purchase.date || getToday(),
      }))
    : [];
  data.sponsors = Array.isArray(sessionData.sponsors)
    ? sessionData.sponsors.map((sponsor) => ({
        ...sponsor,
        value: Number(sponsor.value || 0),
      }))
    : [];
  data.budget = sessionData.budget
    ? {
        expectedSales: Number(sessionData.budget.expectedSales || 0),
        expectedSponsors: Number(sessionData.budget.expectedSponsors || 0),
        expectedPurchases: Number(sessionData.budget.expectedPurchases || 0),
        expectedOtherCosts: Number(sessionData.budget.expectedOtherCosts || 0),
      }
    : { ...defaultData.budget };
  data.sales = Array.isArray(sessionData.sales)
    ? sessionData.sales.map((sale) => ({
        ...sale,
        quantity: Number(sale.quantity || 0),
        price: Number(sale.price || 0),
        total: Number(sale.total || 0),
        status: sale.status || "Betalt",
        date: sale.date || getToday(),
      }))
    : [];
  relinkAllTransactionsToContacts();
  data.isLoggedIn = true;
  saveData();
}

async function syncSessionFromServer() {
  const sessionData = await apiRequest("/api/me", { method: "GET" });
  hydrateSessionData(sessionData);
  return sessionData;
}

function mergeServerProducts(products = []) {
  if (!Array.isArray(products) || products.length === 0) {
    return;
  }

  data.products = data.products.map((product) => {
    const updatedProduct = products.find((candidate) => candidate.id === product.id);
    return updatedProduct ? { ...updatedProduct } : product;
  });
}

function loadRegistry() {
  const savedRegistry =
    localStorage.getItem(REGISTRY_KEY) ||
    localStorage.getItem(OLD_REGISTRY_KEY);

  if (!savedRegistry) {
    return [];
  }

  try {
    const parsedRegistry = JSON.parse(savedRegistry);

    if (!Array.isArray(parsedRegistry)) {
      return [];
    }

    const migratedRegistry = parsedRegistry.map((entry) =>
      migrateData({
        ...cloneDefaultData(),
        ...entry,
        company: {
          ...defaultData.company,
          ...(entry.company || {}),
        },
        user: {
          ...defaultData.user,
          ...(entry.user || {}),
        },
      })
    );

    localStorage.setItem(REGISTRY_KEY, JSON.stringify(migratedRegistry));
    return migratedRegistry;
  } catch {
    return [];
  }
}

function saveRegistry() {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
}

function getActiveCompanyId() {
  return (
    localStorage.getItem(ACTIVE_COMPANY_KEY) ||
    localStorage.getItem(OLD_ACTIVE_COMPANY_KEY)
  );
}

function setActiveCompanyId(companyId) {
  localStorage.setItem(ACTIVE_COMPANY_KEY, companyId);
}

function clearActiveCompanyId() {
  localStorage.removeItem(ACTIVE_COMPANY_KEY);
  localStorage.removeItem(OLD_ACTIVE_COMPANY_KEY);
}

function getCompanyById(companyId) {
  return registry.find((entry) => entry.company.id === companyId);
}

function loadData() {
  const activeCompanyId = getActiveCompanyId();

  if (activeCompanyId) {
    const activeCompany = getCompanyById(activeCompanyId);

    if (activeCompany) {
      return migrateData({
        ...cloneDefaultData(),
        ...activeCompany,
        company: {
          ...defaultData.company,
          ...(activeCompany.company || {}),
        },
        user: {
          ...defaultData.user,
          ...(activeCompany.user || {}),
        },
      });
    }
  }

  const oldSingleCompanyData =
    localStorage.getItem(STORAGE_KEY) ||
    localStorage.getItem(OLD_STORAGE_KEY);

  if (oldSingleCompanyData && registry.length === 0) {
    try {
      const parsedData = JSON.parse(oldSingleCompanyData);

      const migratedData = migrateData({
        ...cloneDefaultData(),
        ...parsedData,
        company: {
          ...defaultData.company,
          ...(parsedData.company || {}),
        },
        user: {
          ...defaultData.user,
          ...(parsedData.user || {}),
        },
      });

      if (migratedData.company.name || migratedData.user.email) {
        if (!migratedData.company.id) {
          migratedData.company.id = createId();
        }

        registry.push(migratedData);
        saveRegistry();
        setActiveCompanyId(migratedData.company.id);

        return migratedData;
      }
    } catch {
      return cloneDefaultData();
    }
  }

  return cloneDefaultData();
}

function migrateData(loadedData) {
  if (!loadedData.company) {
    loadedData.company = { ...defaultData.company };
  }

  if (!loadedData.company.id && loadedData.company.name) {
    loadedData.company.id = createId();
  }

  if (!loadedData.user) {
    loadedData.user = { ...defaultData.user };
  }

  delete loadedData.user.password;

  if (!Array.isArray(loadedData.employees)) loadedData.employees = [];
  if (!Array.isArray(loadedData.contacts)) loadedData.contacts = [];
  if (!Array.isArray(loadedData.products)) loadedData.products = [];
  if (!Array.isArray(loadedData.sales)) loadedData.sales = [];
  if (!Array.isArray(loadedData.purchases)) loadedData.purchases = [];
  if (!Array.isArray(loadedData.sponsors)) loadedData.sponsors = [];

  if (!loadedData.budget) {
    loadedData.budget = { ...defaultData.budget };
  }

  loadedData.budget = {
    expectedSales: Number(loadedData.budget.expectedSales || 0),
    expectedSponsors: Number(loadedData.budget.expectedSponsors || 0),
    expectedPurchases: Number(loadedData.budget.expectedPurchases || 0),
    expectedOtherCosts: Number(loadedData.budget.expectedOtherCosts || 0),
  };

  if (Array.isArray(loadedData.customers)) {
    loadedData.customers.forEach((customer) => {
      if (!findContactByNameInList(loadedData.contacts, customer.name)) {
        loadedData.contacts.push({
          id: createId(),
          name: customer.name,
          type: "Kunde",
          contact: customer.contact || "",
          email: customer.email || "",
          phone: customer.phone || "",
          notes: "",
        });
      }
    });

    delete loadedData.customers;
  }

  loadedData.employees = loadedData.employees.map((employee) => ({
    id: employee.id || createId(),
    name: employee.name || "Ukjent ansatt",
    role: employee.role || "",
    email: employee.email || "",
  }));

  loadedData.contacts = loadedData.contacts.map((contact) => ({
    id: contact.id || createId(),
    name: contact.name || "Ukjent kontakt",
    type: contact.type || "Annet",
    contact: contact.contact || "",
    email: contact.email || "",
    phone: contact.phone || "",
    notes: contact.notes || "",
  }));

  loadedData.products = loadedData.products.map((product) => ({
    id: product.id || createId(),
    name: product.name || "Ukjent produkt",
    description: product.description || "",
    category: product.category || "",
    price: Number(product.price || 0),
    cost: Number(product.cost || 0),
    stock: Number(product.stock || 0),
  }));

  loadedData.sales = loadedData.sales.map((sale) => {
    const customerName = sale.customerName || sale.customer || "Ukjent kunde";
    const contact = findOrCreateContactInData(loadedData, customerName, "Kunde");

    return {
      id: sale.id || createId(),
      contactId: sale.contactId || contact.id,
      productId: sale.productId || "",
      customerName,
      product: sale.product || "",
      quantity: Number(sale.quantity || 0),
      price: Number(sale.price || 0),
      total: Number(
        sale.total || Number(sale.quantity || 0) * Number(sale.price || 0)
      ),
      status: sale.status || "Betalt",
      date: sale.date || getToday(),
    };
  });

  loadedData.purchases = loadedData.purchases.map((purchase) => {
    const supplierName =
      purchase.supplierName || purchase.supplier || "Ukjent leverandør";

    const contact = findOrCreateContactInData(
      loadedData,
      supplierName,
      "Leverandør"
    );

    return {
      id: purchase.id || createId(),
      contactId: purchase.contactId || contact.id,
      supplierName,
      description: purchase.description || "",
      category: purchase.category || "Annet",
      amount: Number(purchase.amount || 0),
      date: purchase.date || getToday(),
    };
  });

  loadedData.sponsors = loadedData.sponsors.map((sponsor) => ({
    id: sponsor.id || createId(),
    name: sponsor.name || "Ukjent sponsor",
    type: sponsor.type || "Annet",
    value: Number(sponsor.value || 0),
  }));

  return loadedData;
}

function saveData() {
  if (!data.company.id) {
    data.company.id = createId();
  }

  const persistedData = structuredClone(data);
  persistedData.isLoggedIn = false;

  if (!persistedData.user) {
    persistedData.user = {};
  }

  delete persistedData.user.password;

  const existingIndex = registry.findIndex(
    (entry) => entry.company.id === data.company.id
  );

  if (existingIndex >= 0) {
    registry[existingIndex] = persistedData;
  } else {
    registry.push(persistedData);
  }

  saveRegistry();
  setActiveCompanyId(data.company.id);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedData));
}

function showOnly(screen) {
  welcomeScreen.classList.add("hidden");
  loginScreen.classList.add("hidden");
  registerScreen.classList.add("hidden");
  adminScreen.classList.add("hidden");
  app.classList.add("hidden");

  screen.classList.remove("hidden");
}

function showApp() {
  showOnly(app);
  renderAll();
}

function formatCurrency(amount) {
  return `${Number(amount || 0).toLocaleString("no-NO")} kr`;
}

function getToday() {
  return new Date().toLocaleDateString("no-NO");
}

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return String(Date.now() + Math.random());
}

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function findContactByNameInList(contactList, name) {
  return contactList.find(
    (contact) => normalizeName(contact.name) === normalizeName(name)
  );
}

function findContactByName(name) {
  return findContactByNameInList(data.contacts, name);
}

function findOrCreateContactInData(targetData, name, type = "Kunde") {
  const cleanName = String(name || "").trim();

  if (!cleanName) {
    return null;
  }

  let contact = findContactByNameInList(targetData.contacts, cleanName);

  if (!contact) {
    contact = {
      id: createId(),
      name: cleanName,
      type,
      contact: "",
      email: "",
      phone: "",
      notes: "",
    };

    targetData.contacts.push(contact);
  }

  return contact;
}

function findOrCreateContact(name, type = "Kunde") {
  return findOrCreateContactInData(data, name, type);
}

function idsMatch(left, right) {
  return String(left || "") === String(right || "");
}

function getContactById(contactId) {
  return data.contacts.find((contact) => idsMatch(contact.id, contactId));
}

function getProductById(productId) {
  return data.products.find((product) => idsMatch(product.id, productId));
}

function relinkTransactionsForContact(contact) {
  if (!contact || !contact.name) {
    return;
  }

  data.sales.forEach((sale) => {
    if (!sale.contactId && normalizeName(sale.customerName) === normalizeName(contact.name)) {
      sale.contactId = contact.id;
    }
  });

  data.purchases.forEach((purchase) => {
    if (!purchase.contactId && normalizeName(purchase.supplierName) === normalizeName(contact.name)) {
      purchase.contactId = contact.id;
    }
  });
}

function relinkAllTransactionsToContacts() {
  data.contacts.forEach((contact) => {
    relinkTransactionsForContact(contact);
  });
}

function syncSaleProductFields(productId) {
  const saleForm = document.querySelector("#sale-form");

  if (!saleForm) {
    return;
  }

  const product = getProductById(productId);

  if (!product) {
    saleForm.elements.product.value = "";
    saleForm.elements.price.value = "";
    return;
  }

  saleForm.elements.product.value = product.name || "";
  saleForm.elements.price.value = Number(product.price || 0);
}

function createEmptyRow(colspan, text) {
  return `<tr><td colspan="${colspan}" class="placeholder">${text}</td></tr>`;
}

function setActivePage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.remove("active");
  });

  const page = document.querySelector(`#${pageId}`);
  const navButton = document.querySelector(`[data-page="${pageId}"]`);

  if (!page) {
    console.error(`Fant ikke siden med id: ${pageId}`);
    return;
  }

  page.classList.add("active");

  if (navButton) {
    navButton.classList.add("active");
  }

  pageTitle.textContent = pageInfo[pageId]?.title || "Vendera";
  pageDescription.textContent = pageInfo[pageId]?.description || "";
}

function calculateTotals() {
  const totalSales = data.sales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  );

  const totalPurchases = data.purchases.reduce(
    (sum, purchase) => sum + Number(purchase.amount || 0),
    0
  );

  const totalSponsors = data.sponsors.reduce(
    (sum, sponsor) => sum + Number(sponsor.value || 0),
    0
  );

  const result = totalSales + totalSponsors - totalPurchases;

  return {
    totalSales,
    totalPurchases,
    totalSponsors,
    result,
  };
}

function calculateBudget() {
  const totals = calculateTotals();

  const expectedIncome =
    Number(data.budget.expectedSales || 0) +
    Number(data.budget.expectedSponsors || 0);

  const actualIncome = totals.totalSales + totals.totalSponsors;

  const expectedCosts =
    Number(data.budget.expectedPurchases || 0) +
    Number(data.budget.expectedOtherCosts || 0);

  const actualCosts = totals.totalPurchases;

  const expectedResult = expectedIncome - expectedCosts;
  const actualResult = actualIncome - actualCosts;
  const variance = actualResult - expectedResult;

  return {
    expectedIncome,
    actualIncome,
    expectedCosts,
    actualCosts,
    expectedResult,
    actualResult,
    variance,
  };
}

function getInputValue(selector) {
  const element = document.querySelector(selector);
  return element ? element.value.trim() : "";
}

function setEditMode(type, id) {
  editState[`${type}Id`] = id;

  const submitButton = document.querySelector(`#${type}-submit-btn`);
  const cancelButton = document.querySelector(`#cancel-${type}-edit-btn`);

  if (submitButton) {
    submitButton.textContent = "Lagre endringer";
  }

  if (cancelButton) {
    cancelButton.classList.remove("hidden");
  }
}

function clearEditMode(type) {
  editState[`${type}Id`] = null;

  const submitButton = document.querySelector(`#${type}-submit-btn`);
  const cancelButton = document.querySelector(`#cancel-${type}-edit-btn`);

  const defaultLabels = {
    employee: "Lagre ansatt",
    contact: "Lagre kontakt",
    product: "Lagre produkt",
    sale: "Lagre salg",
    purchase: "Lagre innkjøp",
    sponsor: "Lagre sponsor",
  };

  if (submitButton) {
    submitButton.textContent = defaultLabels[type] || "Lagre";
  }

  if (cancelButton) {
    cancelButton.classList.add("hidden");
  }
}

function clearAllEditModes() {
  Object.keys(editState).forEach((key) => {
    editState[key] = null;
  });

  ["employee", "contact", "product", "sale", "purchase", "sponsor"].forEach(
    (type) => clearEditMode(type)
  );
}

function confirmDelete(message = "Er du sikker på at du vil slette dette?") {
  return window.confirm(message);
}

function restoreStockFromSale(sale) {
  if (!sale.productId) return;

  const product = getProductById(sale.productId);

  if (product) {
    product.stock = Number(product.stock || 0) + Number(sale.quantity || 0);
  }
}

function subtractStockForSale(productId, quantity) {
  if (!productId) return;

  const product = getProductById(productId);

  if (product) {
    product.stock = Math.max(0, Number(product.stock || 0) - Number(quantity || 0));
  }
}

function renderDashboard() {
  const totals = calculateTotals();

  document.querySelector("#total-sales").textContent = formatCurrency(
    totals.totalSales
  );

  document.querySelector("#total-purchases").textContent = formatCurrency(
    totals.totalPurchases
  );

  document.querySelector("#total-sponsors").textContent = formatCurrency(
    totals.totalSponsors
  );

  document.querySelector("#result").textContent = formatCurrency(totals.result);

  renderRecentSales();
  renderRecentPurchases();
}

function renderRecentSales() {
  const table = document.querySelector("#recent-sales-table");

  if (data.sales.length === 0) {
    table.innerHTML = createEmptyRow(4, "Ingen salg registrert ennå.");
    return;
  }

  table.innerHTML = data.sales
    .slice(-5)
    .reverse()
    .map(
      (sale) => `
      <tr>
        <td>${sale.date}</td>
        <td>${sale.customerName}</td>
        <td>${sale.product}</td>
        <td>${formatCurrency(sale.total)}</td>
      </tr>
    `
    )
    .join("");
}

function renderRecentPurchases() {
  const table = document.querySelector("#recent-purchases-table");

  if (data.purchases.length === 0) {
    table.innerHTML = createEmptyRow(5, "Ingen innkjøp registrert ennå.");
    return;
  }

  table.innerHTML = data.purchases
    .slice(-5)
    .reverse()
    .map(
      (purchase) => `
      <tr>
        <td>${purchase.date}</td>
        <td>${purchase.supplierName}</td>
        <td>${purchase.description}</td>
        <td>${purchase.category}</td>
        <td>${formatCurrency(purchase.amount)}</td>
      </tr>
    `
    )
    .join("");
}

function renderEmployees() {
  const table = document.querySelector("#employees-table");

  if (data.employees.length === 0) {
    table.innerHTML = createEmptyRow(4, "Ingen ansatte lagt til ennå.");
    return;
  }

  table.innerHTML = data.employees
    .map(
      (employee) => `
      <tr>
        <td>${employee.name}</td>
        <td>${employee.role}</td>
        <td>${employee.email || "-"}</td>
        <td>
          <div class="action-buttons">
            <button class="button small secondary" data-edit-employee="${employee.id}">
              Rediger
            </button>
            <button class="button small danger" data-delete-employee="${employee.id}">
              Slett
            </button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  table.querySelectorAll("[data-edit-employee]").forEach((button) => {
    button.addEventListener("click", () => startEditEmployee(button.dataset.editEmployee));
  });

  table.querySelectorAll("[data-delete-employee]").forEach((button) => {
    button.addEventListener("click", () => deleteEmployee(button.dataset.deleteEmployee));
  });
}

function startEditEmployee(employeeId) {
  const employee = data.employees.find((item) => item.id === employeeId);
  if (!employee) return;

  const form = document.querySelector("#employee-form");

  form.elements.name.value = employee.name;
  form.elements.role.value = employee.role;
  form.elements.email.value = employee.email;

  setEditMode("employee", employeeId);
  setActivePage("employees");
}

function cancelEditEmployee() {
  document.querySelector("#employee-form").reset();
  clearEditMode("employee");
}

function deleteEmployee(employeeId) {
  if (!confirmDelete("Er du sikker på at du vil slette denne ansatte?")) return;

  data.employees = data.employees.filter((employee) => employee.id !== employeeId);

  if (editState.employeeId === employeeId) {
    cancelEditEmployee();
  }

  saveData();
  renderAll();
}

function renderContacts() {
  const table = document.querySelector("#contacts-table");

  if (!table) return;

  const search = normalizeName(getInputValue("#contacts-search"));
  const typeFilter = getInputValue("#contacts-type-filter");

  const filteredContacts = data.contacts.filter((contact) => {
    const matchesSearch =
      normalizeName(contact.name).includes(search) ||
      normalizeName(contact.contact).includes(search) ||
      normalizeName(contact.email).includes(search);

    const matchesType = !typeFilter || contact.type === typeFilter;

    return matchesSearch && matchesType;
  });

  if (filteredContacts.length === 0) {
    table.innerHTML = createEmptyRow(5, "Ingen kontakter funnet.");
    return;
  }

  table.innerHTML = filteredContacts
    .map(
      (contact) => `
      <tr>
        <td>${contact.name}</td>
        <td>${contact.type}</td>
        <td>${contact.contact || "-"}</td>
        <td>${contact.email || "-"}</td>
        <td>
          <div class="action-buttons">
            <button class="button small secondary" data-contact-id="${contact.id}">
              Vis
            </button>
            <button class="button small secondary" data-edit-contact="${contact.id}">
              Rediger
            </button>
            <button class="button small danger" data-delete-contact="${contact.id}">
              Slett
            </button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  table.querySelectorAll("[data-contact-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openContactDetails(button.dataset.contactId);
    });
  });

  table.querySelectorAll("[data-edit-contact]").forEach((button) => {
    button.addEventListener("click", () => startEditContact(button.dataset.editContact));
  });

  table.querySelectorAll("[data-delete-contact]").forEach((button) => {
    button.addEventListener("click", () => deleteContact(button.dataset.deleteContact));
  });
}

function startEditContact(contactId) {
  const contact = getContactById(contactId);
  if (!contact) return;

  const form = document.querySelector("#contact-form");

  form.elements.name.value = contact.name;
  form.elements.type.value = contact.type;
  form.elements.contact.value = contact.contact;
  form.elements.email.value = contact.email;
  form.elements.phone.value = contact.phone;

  setEditMode("contact", contactId);
  setActivePage("contacts");
}

function cancelEditContact() {
  document.querySelector("#contact-form").reset();
  clearEditMode("contact");
}

function deleteContact(contactId) {
  const contact = getContactById(contactId);

  if (!contact) return;

  if (
    !confirmDelete(
      `Er du sikker på at du vil slette kontakten "${contact.name}"? Gamle salg og innkjøp beholdes, men koblingen til kontakten fjernes.`
    )
  ) {
    return;
  }

  data.sales.forEach((sale) => {
    if (idsMatch(sale.contactId, contactId)) {
      sale.contactId = "";
      sale.customerName = contact.name;
    }
  });

  data.purchases.forEach((purchase) => {
    if (idsMatch(purchase.contactId, contactId)) {
      purchase.contactId = "";
      purchase.supplierName = contact.name;
    }
  });

  data.contacts = data.contacts.filter((item) => !idsMatch(item.id, contactId));

  if (idsMatch(editState.contactId, contactId)) {
    cancelEditContact();
  }

  saveData();
  renderAll();
}

function openContactDetails(contactId) {
  const contact = getContactById(contactId);

  if (!contact) {
    alert("Fant ikke kontakten.");
    return;
  }

  const contactSales = data.sales.filter((sale) => idsMatch(sale.contactId, contactId));
  const contactPurchases = data.purchases.filter(
    (purchase) => idsMatch(purchase.contactId, contactId)
  );

  const totalSales = contactSales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  );

  const totalPurchases = contactPurchases.reduce(
    (sum, purchase) => sum + Number(purchase.amount || 0),
    0
  );

  document.querySelector("#contact-details-name").textContent = contact.name;

  document.querySelector("#contact-details-info").innerHTML = `
    Type: ${contact.type}<br>
    Kontaktperson: ${contact.contact || "-"}<br>
    E-post: ${contact.email || "-"}<br>
    Telefon: ${contact.phone || "-"}
  `;

  document.querySelector("#contact-total-sales").textContent =
    formatCurrency(totalSales);

  document.querySelector("#contact-total-purchases").textContent =
    formatCurrency(totalPurchases);

  const salesTable = document.querySelector("#contact-sales-table");

  if (contactSales.length === 0) {
    salesTable.innerHTML = createEmptyRow(
      5,
      "Ingen salg knyttet til denne kontakten."
    );
  } else {
    salesTable.innerHTML = contactSales
      .map(
        (sale) => `
        <tr>
          <td>${sale.date}</td>
          <td>${sale.product}</td>
          <td>${sale.quantity}</td>
          <td>${formatCurrency(sale.total)}</td>
          <td>${sale.status}</td>
        </tr>
      `
      )
      .join("");
  }

  const purchasesTable = document.querySelector("#contact-purchases-table");

  if (contactPurchases.length === 0) {
    purchasesTable.innerHTML = createEmptyRow(
      4,
      "Ingen innkjøp knyttet til denne kontakten."
    );
  } else {
    purchasesTable.innerHTML = contactPurchases
      .map(
        (purchase) => `
        <tr>
          <td>${purchase.date}</td>
          <td>${purchase.description}</td>
          <td>${purchase.category}</td>
          <td>${formatCurrency(purchase.amount)}</td>
        </tr>
      `
      )
      .join("");
  }

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  document.querySelector("#contact-details").classList.add("active");

  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.remove("active");
  });

  pageTitle.textContent = contact.name;
  pageDescription.textContent = "Salg og innkjøp knyttet til denne kontakten.";
}

function renderProducts() {
  const table = document.querySelector("#products-table");

  if (!table) return;

  const search = normalizeName(getInputValue("#products-search"));
  const categoryFilter = normalizeName(getInputValue("#products-category-filter"));

  const filteredProducts = data.products.filter((product) => {
    const matchesSearch =
      normalizeName(product.name).includes(search) ||
      normalizeName(product.description).includes(search) ||
      normalizeName(product.category).includes(search);

    const matchesCategory =
      !categoryFilter || normalizeName(product.category).includes(categoryFilter);

    return matchesSearch && matchesCategory;
  });

  if (filteredProducts.length === 0) {
    table.innerHTML = createEmptyRow(6, "Ingen produkter funnet.");
    return;
  }

  table.innerHTML = filteredProducts
    .map(
      (product) => `
      <tr>
        <td>${product.name}</td>
        <td>${product.category || "-"}</td>
        <td>${formatCurrency(product.price)}</td>
        <td>${formatCurrency(product.cost)}</td>
        <td>${product.stock}</td>
        <td>
          <div class="action-buttons">
            <button class="button small secondary" data-edit-product="${product.id}">
              Rediger
            </button>
            <button class="button small danger" data-delete-product="${product.id}">
              Slett
            </button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  table.querySelectorAll("[data-edit-product]").forEach((button) => {
    button.addEventListener("click", () => startEditProduct(button.dataset.editProduct));
  });

  table.querySelectorAll("[data-delete-product]").forEach((button) => {
    button.addEventListener("click", () => deleteProduct(button.dataset.deleteProduct));
  });
}

function startEditProduct(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const form = document.querySelector("#product-form");

  form.elements.name.value = product.name;
  form.elements.description.value = product.description;
  form.elements.category.value = product.category;
  form.elements.price.value = product.price;
  form.elements.cost.value = product.cost;
  form.elements.stock.value = product.stock;

  setEditMode("product", productId);
  setActivePage("products");
}

function cancelEditProduct() {
  document.querySelector("#product-form").reset();
  clearEditMode("product");
}

function deleteProduct(productId) {
  const product = getProductById(productId);

  if (!product) return;

  if (
    !confirmDelete(
      `Er du sikker på at du vil slette produktet "${product.name}"? Gamle salg beholdes som historikk.`
    )
  ) {
    return;
  }

  data.sales.forEach((sale) => {
    if (sale.productId === productId) {
      sale.productId = "";
    }
  });

  data.products = data.products.filter((item) => item.id !== productId);

  if (editState.productId === productId) {
    cancelEditProduct();
  }

  saveData();
  renderAll();
}

function renderProductOptions() {
  const select = document.querySelector("#sale-product-select");

  if (!select) return;

  const currentValue = select.value;

  select.innerHTML = `<option value="">Skriv inn manuelt</option>`;

  data.products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${product.name} - ${formatCurrency(product.price)}`;
    select.appendChild(option);
  });

  select.value = currentValue;
  syncSaleProductFields(select.value);
}

function renderSales() {
  const table = document.querySelector("#sales-table");

  if (!table) return;

  const search = normalizeName(getInputValue("#sales-search"));
  const statusFilter = getInputValue("#sales-status-filter");

  const filteredSales = data.sales.filter((sale) => {
    const matchesSearch =
      normalizeName(sale.customerName).includes(search) ||
      normalizeName(sale.product).includes(search);

    const matchesStatus = !statusFilter || sale.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (filteredSales.length === 0) {
    table.innerHTML = createEmptyRow(7, "Ingen salg funnet.");
    return;
  }

  table.innerHTML = filteredSales
    .map(
      (sale) => `
      <tr>
        <td>${sale.date}</td>
        <td>${sale.customerName}</td>
        <td>${sale.product}</td>
        <td>${sale.quantity}</td>
        <td>${formatCurrency(sale.total)}</td>
        <td>${sale.status}</td>
        <td>
          <div class="action-buttons">
            <button class="button small secondary" data-edit-sale="${sale.id}">
              Rediger
            </button>
            <button class="button small danger" data-delete-sale="${sale.id}">
              Slett
            </button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  table.querySelectorAll("[data-edit-sale]").forEach((button) => {
    button.addEventListener("click", () => startEditSale(button.dataset.editSale));
  });

  table.querySelectorAll("[data-delete-sale]").forEach((button) => {
    button.addEventListener("click", () => deleteSale(button.dataset.deleteSale));
  });
}

function startEditSale(saleId) {
  const sale = data.sales.find((item) => item.id === saleId);
  if (!sale) return;

  const form = document.querySelector("#sale-form");

  form.elements.customer.value = sale.customerName;
  form.elements.productId.value = sale.productId || "";
  syncSaleProductFields(sale.productId);
  if (!sale.productId) {
    form.elements.product.value = sale.product;
  }
  form.elements.quantity.value = sale.quantity;
  form.elements.price.value = sale.price;
  form.elements.status.value = sale.status;

  setEditMode("sale", saleId);
  setActivePage("sales");
}

function cancelEditSale() {
  document.querySelector("#sale-form").reset();
  clearEditMode("sale");
}

function deleteSale(saleId) {
  const sale = data.sales.find((item) => item.id === saleId);

  if (!sale) return;

  if (!confirmDelete("Er du sikker på at du vil slette dette salget?")) return;

  restoreStockFromSale(sale);

  data.sales = data.sales.filter((item) => item.id !== saleId);

  if (editState.saleId === saleId) {
    cancelEditSale();
  }

  saveData();
  renderAll();
}

function renderPurchases() {
  const table = document.querySelector("#purchases-table");

  if (!table) return;

  const search = normalizeName(getInputValue("#purchases-search"));
  const categoryFilter = getInputValue("#purchases-category-filter");

  const filteredPurchases = data.purchases.filter((purchase) => {
    const matchesSearch =
      normalizeName(purchase.supplierName).includes(search) ||
      normalizeName(purchase.description).includes(search);

    const matchesCategory =
      !categoryFilter || purchase.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  if (filteredPurchases.length === 0) {
    table.innerHTML = createEmptyRow(6, "Ingen innkjøp funnet.");
    return;
  }

  table.innerHTML = filteredPurchases
    .map(
      (purchase) => `
      <tr>
        <td>${purchase.date}</td>
        <td>${purchase.supplierName}</td>
        <td>${purchase.description}</td>
        <td>${purchase.category}</td>
        <td>${formatCurrency(purchase.amount)}</td>
        <td>
          <div class="action-buttons">
            <button class="button small secondary" data-edit-purchase="${purchase.id}">
              Rediger
            </button>
            <button class="button small danger" data-delete-purchase="${purchase.id}">
              Slett
            </button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  table.querySelectorAll("[data-edit-purchase]").forEach((button) => {
    button.addEventListener("click", () =>
      startEditPurchase(button.dataset.editPurchase)
    );
  });

  table.querySelectorAll("[data-delete-purchase]").forEach((button) => {
    button.addEventListener("click", () =>
      deletePurchase(button.dataset.deletePurchase)
    );
  });
}

function startEditPurchase(purchaseId) {
  const purchase = data.purchases.find((item) => item.id === purchaseId);
  if (!purchase) return;

  const form = document.querySelector("#purchase-form");

  form.elements.supplier.value = purchase.supplierName;
  form.elements.description.value = purchase.description;
  form.elements.category.value = purchase.category;
  form.elements.amount.value = purchase.amount;

  setEditMode("purchase", purchaseId);
  setActivePage("purchases");
}

function cancelEditPurchase() {
  document.querySelector("#purchase-form").reset();
  clearEditMode("purchase");
}

function deletePurchase(purchaseId) {
  if (!confirmDelete("Er du sikker på at du vil slette dette innkjøpet?")) return;

  data.purchases = data.purchases.filter((item) => item.id !== purchaseId);

  if (editState.purchaseId === purchaseId) {
    cancelEditPurchase();
  }

  saveData();
  renderAll();
}

function renderBudget() {
  const budget = calculateBudget();

  document.querySelector("#budget-expected-sales").value =
    data.budget.expectedSales;

  document.querySelector("#budget-expected-sponsors").value =
    data.budget.expectedSponsors;

  document.querySelector("#budget-expected-purchases").value =
    data.budget.expectedPurchases;

  document.querySelector("#budget-expected-other-costs").value =
    data.budget.expectedOtherCosts;

  document.querySelector("#budget-expected-income-display").textContent =
    formatCurrency(budget.expectedIncome);

  document.querySelector("#budget-actual-income-display").textContent =
    formatCurrency(budget.actualIncome);

  document.querySelector("#budget-expected-costs-display").textContent =
    formatCurrency(budget.expectedCosts);

  document.querySelector("#budget-actual-costs-display").textContent =
    formatCurrency(budget.actualCosts);

  document.querySelector("#budget-expected-result-display").textContent =
    formatCurrency(budget.expectedResult);

  document.querySelector("#budget-actual-result-display").textContent =
    formatCurrency(budget.actualResult);

  document.querySelector("#budget-variance-display").textContent =
    formatCurrency(budget.variance);
}

function renderSponsors() {
  const table = document.querySelector("#sponsors-table");

  if (data.sponsors.length === 0) {
    table.innerHTML = createEmptyRow(4, "Ingen sponsorer lagt til ennå.");
    return;
  }

  table.innerHTML = data.sponsors
    .map(
      (sponsor) => `
      <tr>
        <td>${sponsor.name}</td>
        <td>${sponsor.type}</td>
        <td>${formatCurrency(sponsor.value)}</td>
        <td>
          <div class="action-buttons">
            <button class="button small secondary" data-edit-sponsor="${sponsor.id}">
              Rediger
            </button>
            <button class="button small danger" data-delete-sponsor="${sponsor.id}">
              Slett
            </button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  table.querySelectorAll("[data-edit-sponsor]").forEach((button) => {
    button.addEventListener("click", () =>
      startEditSponsor(button.dataset.editSponsor)
    );
  });

  table.querySelectorAll("[data-delete-sponsor]").forEach((button) => {
    button.addEventListener("click", () =>
      deleteSponsor(button.dataset.deleteSponsor)
    );
  });
}

function startEditSponsor(sponsorId) {
  const sponsor = data.sponsors.find((item) => item.id === sponsorId);
  if (!sponsor) return;

  const form = document.querySelector("#sponsor-form");

  form.elements.name.value = sponsor.name;
  form.elements.type.value = sponsor.type;
  form.elements.value.value = sponsor.value;

  setEditMode("sponsor", sponsorId);
  setActivePage("sponsors");
}

function cancelEditSponsor() {
  document.querySelector("#sponsor-form").reset();
  clearEditMode("sponsor");
}

function deleteSponsor(sponsorId) {
  if (!confirmDelete("Er du sikker på at du vil slette denne sponsoren?")) return;

  data.sponsors = data.sponsors.filter((item) => item.id !== sponsorId);

  if (editState.sponsorId === sponsorId) {
    cancelEditSponsor();
  }

  saveData();
  renderAll();
}

function renderReport() {
  const totals = calculateTotals();
  const budget = calculateBudget();

  document.querySelector("#report-summary").innerHTML = `
    <strong>Rapport for ${data.company.name || "elevbedriften"}</strong><br><br>
    Totalt salg: ${formatCurrency(totals.totalSales)}<br>
    Totale innkjøp: ${formatCurrency(totals.totalPurchases)}<br>
    Sponsorinntekter: ${formatCurrency(totals.totalSponsors)}<br>
    Resultat: ${formatCurrency(totals.result)}<br><br>
    Forventet resultat: ${formatCurrency(budget.expectedResult)}<br>
    Budsjettavvik: ${formatCurrency(budget.variance)}<br><br>
    Antall ansatte: ${data.employees.length}<br>
    Antall kontakter: ${data.contacts.length}<br>
    Antall produkter/tjenester: ${data.products.length}<br>
    Antall registrerte salg: ${data.sales.length}<br>
    Antall registrerte innkjøp: ${data.purchases.length}<br>
    Antall sponsorer: ${data.sponsors.length}
  `;
}

function renderCompanyInfo() {
  document.querySelector("#sidebar-company-name").textContent =
    data.company.name || "Elevbedrift";

  document.querySelector("#current-user-name").textContent =
    data.user.name || "Daglig leder";

  document.querySelector("#settings-company-name").value = data.company.name || "";
  document.querySelector("#settings-company-school").value =
    data.company.school || "";
}

function renderAll() {
  renderCompanyInfo();
  renderDashboard();
  renderEmployees();
  renderContacts();
  renderProducts();
  renderProductOptions();
  renderSales();
  renderPurchases();
  renderBudget();
  renderSponsors();
  renderReport();
}

function renderAdminCompanies() {
  const table = document.querySelector("#admin-eb-table");

  if (registry.length === 0) {
    table.innerHTML = createEmptyRow(5, "Ingen elevbedrifter registrert ennå.");
    return;
  }

  table.innerHTML = registry
    .map(
      (entry) => `
      <tr>
        <td>${entry.company.name || "-"}</td>
        <td>${entry.company.school || "-"}</td>
        <td>${entry.user.name || "-"}</td>
        <td>${entry.user.email || "-"}</td>
        <td>
          <button class="button danger" data-delete-company-id="${entry.company.id}">
            Slett
          </button>
        </td>
      </tr>
    `
    )
    .join("");

  table.querySelectorAll("[data-delete-company-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openDeleteCompanyPanel(button.dataset.deleteCompanyId);
    });
  });
}

function openDeleteCompanyPanel(companyId) {
  const companyEntry = getCompanyById(companyId);

  if (!companyEntry) {
    alert("Fant ikke elevbedriften.");
    return;
  }

  companyToDeleteId = companyId;

  document.querySelector("#delete-company-panel").classList.remove("hidden");
  document.querySelector("#delete-company-confirm-input").value = "";
  const isActiveCompany = getActiveCompanyId() === companyId && data.isLoggedIn;
  const deleteWarningText = isActiveCompany
    ? "Dette vil slette elevbedriften fra serveren og logge deg ut. Handlingen kan ikke angres."
    : "Dette kan ikke angres i prototypen.";

  document.querySelector("#delete-company-text").innerHTML = `
    Du er i ferd med å slette <strong>${companyEntry.company.name}</strong>.<br>
    ${deleteWarningText}
  `;
}

function hideDeleteCompanyPanel() {
  companyToDeleteId = null;
  document.querySelector("#delete-company-panel").classList.add("hidden");
  document.querySelector("#delete-company-confirm-input").value = "";
}

function deleteSelectedCompany() {
  if (!companyToDeleteId) {
    return;
  }

  const companyEntry = getCompanyById(companyToDeleteId);

  if (!companyEntry) {
    alert("Fant ikke elevbedriften.");
    hideDeleteCompanyPanel();
    return;
  }

  const confirmationInput = document
    .querySelector("#delete-company-confirm-input")
    .value.trim();

  if (confirmationInput !== companyEntry.company.name) {
    alert("Navnet stemmer ikke. Sletting ble stoppet.");
    return;
  }

  const isActiveCompany = getActiveCompanyId() === companyToDeleteId && data.isLoggedIn;

  if (!isActiveCompany) {
    registry = registry.filter((entry) => entry.company.id !== companyToDeleteId);
    saveRegistry();
    hideDeleteCompanyPanel();
    renderAdminCompanies();
    alert("Elevbedriften er slettet fra prototypen.");
    return;
  }

  (async () => {
    try {
      await apiRequest("/api/company", {
        method: "DELETE",
        body: JSON.stringify({
          confirmationName: confirmationInput,
        }),
      });

      registry = registry.filter((entry) => entry.company.id !== companyToDeleteId);
      saveRegistry();
      clearActiveCompanyId();
      data = cloneDefaultData();
      hideDeleteCompanyPanel();
      renderAdminCompanies();
      showOnly(welcomeScreen);
      alert("Elevbedriften er slettet.");
    } catch (err) {
      alert(err.message);
    }
  })();
}

document.querySelector("#show-login-btn").addEventListener("click", () => {
  showOnly(loginScreen);
});

document.querySelector("#show-register-btn").addEventListener("click", () => {
  showOnly(registerScreen);
});

document.querySelector("#show-admin-btn").addEventListener("click", () => {
  renderAdminCompanies();
  showOnly(adminScreen);
});

document.querySelector("#show-register-btn-hero").addEventListener("click", () => {
  showOnly(registerScreen);
});

document.querySelector("#show-login-btn-hero").addEventListener("click", () => {
  showOnly(loginScreen);
});

document.querySelector("#back-from-login").addEventListener("click", () => {
  showOnly(welcomeScreen);
});

document.querySelector("#back-from-register").addEventListener("click", () => {
  showOnly(welcomeScreen);
});

document.querySelector("#back-from-admin").addEventListener("click", () => {
  hideDeleteCompanyPanel();
  showOnly(welcomeScreen);
});

document.querySelector("#logout-btn").addEventListener("click", async () => {
  await apiRequest("/api/logout", { method: "POST" });
  clearAllEditModes();
  data.isLoggedIn = false;
  saveData();
  clearActiveCompanyId();
  showOnly(welcomeScreen);
});

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => {
    setActivePage(button.dataset.page);
  });
});

document.querySelector("#employee-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);

  if (editState.employeeId) {
    const employee = data.employees.find(
      (item) => item.id === editState.employeeId
    );

    if (employee) {
      employee.name = formData.get("name");
      employee.role = formData.get("role");
      employee.email = formData.get("email");
    }

    clearEditMode("employee");
  } else {
    data.employees.push({
      id: createId(),
      name: formData.get("name"),
      role: formData.get("role"),
      email: formData.get("email"),
    });
  }

  saveData();
  event.target.reset();
  renderAll();
});

document.querySelector("#contact-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const name = String(formData.get("name") || "").trim();

  if (!name) {
    alert("Kontakten må ha et navn.");
    return;
  }

  if (editState.contactId) {
    const contact = getContactById(editState.contactId);

    if (contact) {
      const oldName = contact.name;

      contact.name = name;
      contact.type = formData.get("type");
      contact.contact = formData.get("contact");
      contact.email = formData.get("email");
      contact.phone = formData.get("phone");
      relinkTransactionsForContact(contact);

      data.sales.forEach((sale) => {
        if (idsMatch(sale.contactId, contact.id) && sale.customerName === oldName) {
          sale.customerName = contact.name;
        }
      });

      data.purchases.forEach((purchase) => {
        if (idsMatch(purchase.contactId, contact.id) && purchase.supplierName === oldName) {
          purchase.supplierName = contact.name;
        }
      });
    }

    clearEditMode("contact");
    } else {
      let contact = findContactByName(name);

      if (contact) {
        contact.type = formData.get("type");
        contact.contact = formData.get("contact");
        contact.email = formData.get("email");
        contact.phone = formData.get("phone");
        relinkTransactionsForContact(contact);
      } else {
        data.contacts.push({
          id: createId(),
          name,
          type: formData.get("type"),
          contact: formData.get("contact"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          notes: "",
        });
        relinkTransactionsForContact(data.contacts[data.contacts.length - 1]);
      }
    }

  saveData();
  event.target.reset();
  renderAll();
});

document.querySelector("#product-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);

  if (editState.productId) {
    const product = getProductById(editState.productId);

    if (product) {
      product.name = formData.get("name");
      product.description = formData.get("description");
      product.category = formData.get("category");
      product.price = Number(formData.get("price"));
      product.cost = Number(formData.get("cost"));
      product.stock = Number(formData.get("stock"));

      data.sales.forEach((sale) => {
        if (sale.productId === product.id) {
          sale.product = product.name;
          sale.price = product.price;
          sale.total = Number(sale.quantity || 0) * Number(product.price || 0);
        }
      });
    }

    clearEditMode("product");
  } else {
    data.products.push({
      id: createId(),
      name: formData.get("name"),
      description: formData.get("description"),
      category: formData.get("category"),
      price: Number(formData.get("price")),
      cost: Number(formData.get("cost")),
      stock: Number(formData.get("stock")),
    });
  }

  saveData();
  event.target.reset();
  renderAll();
});

document.querySelector("#sale-product-select").addEventListener("change", (event) => {
  syncSaleProductFields(event.target.value);
});

document.querySelector("#sale-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);

  const quantity = Number(formData.get("quantity"));
  const price = Number(formData.get("price"));
  const total = quantity * price;

  const contact = findOrCreateContact(formData.get("customer"), "Kunde");

  if (!contact) {
    alert("Kunde/firma må fylles inn.");
    return;
  }

  const selectedProductId = formData.get("productId");
  const selectedProduct = getProductById(selectedProductId);

  const productName =
    selectedProduct?.name || String(formData.get("product") || "").trim();

  if (!productName) {
    alert("Produkt/tjeneste må fylles inn eller velges.");
    return;
  }

  if (editState.saleId) {
    const sale = data.sales.find((item) => item.id === editState.saleId);

    if (sale) {
      restoreStockFromSale(sale);
      subtractStockForSale(selectedProductId, quantity);

      sale.contactId = contact.id;
      sale.productId = selectedProductId || "";
      sale.customerName = contact.name;
      sale.product = productName;
      sale.quantity = quantity;
      sale.price = price;
      sale.total = total;
      sale.status = formData.get("status");
    }

    clearEditMode("sale");
  } else {
    subtractStockForSale(selectedProductId, quantity);

    data.sales.push({
      id: createId(),
      contactId: contact.id,
      productId: selectedProductId || "",
      customerName: contact.name,
      product: productName,
      quantity,
      price,
      total,
      status: formData.get("status"),
      date: getToday(),
    });
  }

  saveData();
  event.target.reset();
  renderAll();
});

document.querySelector("#purchase-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const contact = findOrCreateContact(formData.get("supplier"), "Leverandør");

  if (!contact) {
    alert("Leverandør/firma må fylles inn.");
    return;
  }

  if (editState.purchaseId) {
    const purchase = data.purchases.find(
      (item) => item.id === editState.purchaseId
    );

    if (purchase) {
      purchase.contactId = contact.id;
      purchase.supplierName = contact.name;
      purchase.description = formData.get("description");
      purchase.category = formData.get("category");
      purchase.amount = Number(formData.get("amount"));
    }

    clearEditMode("purchase");
  } else {
    data.purchases.push({
      id: createId(),
      contactId: contact.id,
      supplierName: contact.name,
      description: formData.get("description"),
      category: formData.get("category"),
      amount: Number(formData.get("amount")),
      date: getToday(),
    });
  }

  saveData();
  event.target.reset();
  renderAll();
});

document.querySelector("#budget-form").addEventListener("submit", (event) => {
  event.preventDefault();

  data.budget.expectedSales = Number(
    document.querySelector("#budget-expected-sales").value
  );

  data.budget.expectedSponsors = Number(
    document.querySelector("#budget-expected-sponsors").value
  );

  data.budget.expectedPurchases = Number(
    document.querySelector("#budget-expected-purchases").value
  );

  data.budget.expectedOtherCosts = Number(
    document.querySelector("#budget-expected-other-costs").value
  );

  saveData();
  renderAll();

  alert("Budsjett lagret.");
});

document.querySelector("#sponsor-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);

  if (editState.sponsorId) {
    const sponsor = data.sponsors.find((item) => item.id === editState.sponsorId);

    if (sponsor) {
      sponsor.name = formData.get("name");
      sponsor.type = formData.get("type");
      sponsor.value = Number(formData.get("value"));
    }

    clearEditMode("sponsor");
  } else {
    data.sponsors.push({
      id: createId(),
      name: formData.get("name"),
      type: formData.get("type"),
      value: Number(formData.get("value")),
    });
  }

  saveData();
  event.target.reset();
  renderAll();
});

document.querySelector("#generate-report-btn").addEventListener("click", () => {
  renderReport();
});

document.querySelector("#back-to-contacts-btn").addEventListener("click", () => {
  setActivePage("contacts");
});

document.querySelector("#cancel-employee-edit-btn").addEventListener("click", () => {
  cancelEditEmployee();
});

document.querySelector("#cancel-contact-edit-btn").addEventListener("click", () => {
  cancelEditContact();
});

document.querySelector("#cancel-product-edit-btn").addEventListener("click", () => {
  cancelEditProduct();
});

document.querySelector("#cancel-sale-edit-btn").addEventListener("click", () => {
  cancelEditSale();
});

document.querySelector("#cancel-purchase-edit-btn").addEventListener("click", () => {
  cancelEditPurchase();
});

document.querySelector("#cancel-sponsor-edit-btn").addEventListener("click", () => {
  cancelEditSponsor();
});

document
  .querySelector("#confirm-delete-company-btn")
  .addEventListener("click", () => {
    deleteSelectedCompany();
  });

document
  .querySelector("#cancel-delete-company-btn")
  .addEventListener("click", () => {
    hideDeleteCompanyPanel();
  });

[
  "#contacts-search",
  "#contacts-type-filter",
  "#products-search",
  "#products-category-filter",
  "#sales-search",
  "#sales-status-filter",
  "#purchases-search",
  "#purchases-category-filter",
].forEach((selector) => {
  const element = document.querySelector(selector);

  if (element) {
    element.addEventListener("input", () => {
      renderContacts();
      renderProducts();
      renderSales();
      renderPurchases();
    });

    element.addEventListener("change", () => {
      renderContacts();
      renderProducts();
      renderSales();
      renderPurchases();
    });
  }
});

deleteEmployee = function deleteEmployeeServerBacked(employeeId) {
  return (async () => {
    if (!confirmDelete("Er du sikker pÃ¥ at du vil slette denne ansatte?")) return;

    try {
      await apiRequest(`/api/employees/${employeeId}`, { method: "DELETE" });
      data.employees = data.employees.filter((employee) => employee.id !== employeeId);

      if (editState.employeeId === employeeId) {
        cancelEditEmployee();
      }

      saveData();
      renderAll();
    } catch (err) {
      alert(err.message);
    }
  })();
};

document.querySelector("#register-form").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    try {
      const result = await apiRequest("/api/register", {
        method: "POST",
        body: JSON.stringify({
          companyName: document.querySelector("#company-name").value.trim(),
          school: document.querySelector("#company-school").value.trim(),
          userName: document.querySelector("#ceo-name").value.trim(),
          email: document.querySelector("#register-email").value.trim(),
          password: document.querySelector("#register-password").value,
        }),
      });

      hydrateSessionData(result);
      event.target.reset();
      showApp();
    } catch (err) {
      alert(err.message);
    }
  },
  true
);

document.querySelector("#login-form").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    try {
      const result = await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify({
          email: document.querySelector("#login-email").value.trim(),
          password: document.querySelector("#login-password").value,
        }),
      });

      hydrateSessionData(result);
      event.target.reset();
      showApp();
    } catch (err) {
      alert(err.message);
    }
  },
  true
);

document.querySelector("#employee-form").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const formData = new FormData(event.target);
    const employeePayload = {
      name: String(formData.get("name") || "").trim(),
      role: String(formData.get("role") || "").trim(),
      email: String(formData.get("email") || "").trim(),
    };

    try {
      if (editState.employeeId) {
        const result = await apiRequest(`/api/employees/${editState.employeeId}`, {
          method: "PUT",
          body: JSON.stringify(employeePayload),
        });

        data.employees = data.employees.map((employee) =>
          employee.id === editState.employeeId ? result.employee : employee
        );
        clearEditMode("employee");
      } else {
        const result = await apiRequest("/api/employees", {
          method: "POST",
          body: JSON.stringify(employeePayload),
        });

        data.employees.push(result.employee);
      }

      saveData();
      event.target.reset();
      renderAll();
    } catch (err) {
      alert(err.message);
    }
  },
  true
);

deleteContact = function deleteContactServerBacked(contactId) {
  return (async () => {
    const contact = getContactById(contactId);

    if (!contact) return;

    if (
      !confirmDelete(
        `Er du sikker pa at du vil slette kontakten "${contact.name}"? Gamle salg og innkjop beholdes, men koblingen til kontakten fjernes.`
      )
    ) {
      return;
    }

    try {
      await apiRequest(`/api/contacts/${contactId}`, { method: "DELETE" });

      data.sales.forEach((sale) => {
        if (idsMatch(sale.contactId, contactId)) {
          sale.contactId = "";
          sale.customerName = contact.name;
        }
      });

      data.purchases.forEach((purchase) => {
        if (idsMatch(purchase.contactId, contactId)) {
          purchase.contactId = "";
          purchase.supplierName = contact.name;
        }
      });

      data.contacts = data.contacts.filter((item) => !idsMatch(item.id, contactId));

      if (idsMatch(editState.contactId, contactId)) {
        cancelEditContact();
      }

      saveData();
      renderAll();
    } catch (err) {
      alert(err.message);
    }
  })();
};

document.querySelector("#contact-form").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const formData = new FormData(event.target);
    const name = String(formData.get("name") || "").trim();

    if (!name) {
      alert("Kontakten ma ha et navn.");
      return;
    }

    const contactPayload = {
      name,
      type: String(formData.get("type") || "").trim(),
      contact: String(formData.get("contact") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      notes: "",
    };

    try {
      if (editState.contactId) {
        const oldContact = getContactById(editState.contactId);
        const oldName = oldContact ? oldContact.name : "";
        const result = await apiRequest(`/api/contacts/${editState.contactId}`, {
          method: "PUT",
          body: JSON.stringify(contactPayload),
        });

        data.contacts = data.contacts.map((contact) =>
          idsMatch(contact.id, editState.contactId) ? result.contact : contact
        );
        relinkTransactionsForContact(result.contact);

        if (oldContact) {
          data.sales.forEach((sale) => {
            if (idsMatch(sale.contactId, oldContact.id) && sale.customerName === oldName) {
              sale.customerName = result.contact.name;
            }
          });

          data.purchases.forEach((purchase) => {
            if (idsMatch(purchase.contactId, oldContact.id) && purchase.supplierName === oldName) {
              purchase.supplierName = result.contact.name;
            }
          });
        }

        clearEditMode("contact");
      } else {
        const existingContact = findContactByName(name);

        if (existingContact) {
          const result = await apiRequest(`/api/contacts/${existingContact.id}`, {
            method: "PUT",
            body: JSON.stringify(contactPayload),
          });

          data.contacts = data.contacts.map((contact) =>
            idsMatch(contact.id, existingContact.id) ? result.contact : contact
          );
          relinkTransactionsForContact(result.contact);
        } else {
          const result = await apiRequest("/api/contacts", {
            method: "POST",
            body: JSON.stringify(contactPayload),
          });

          data.contacts.push(result.contact);
          relinkTransactionsForContact(result.contact);
        }
      }

      saveData();
      event.target.reset();
      renderAll();
    } catch (err) {
      alert(err.message);
    }
  },
  true
);

deleteProduct = function deleteProductServerBacked(productId) {
  return (async () => {
    const product = getProductById(productId);

    if (!product) return;

    if (
      !confirmDelete(
        `Er du sikker pa at du vil slette produktet "${product.name}"? Gamle salg beholdes som historikk.`
      )
    ) {
      return;
    }

    try {
      await apiRequest(`/api/products/${productId}`, { method: "DELETE" });

      data.sales.forEach((sale) => {
        if (sale.productId === productId) {
          sale.productId = "";
        }
      });

      data.products = data.products.filter((item) => item.id !== productId);

      if (editState.productId === productId) {
        cancelEditProduct();
      }

      saveData();
      renderAll();
    } catch (err) {
      alert(err.message);
    }
  })();
};

document.querySelector("#product-form").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const formData = new FormData(event.target);
    const productPayload = {
      name: String(formData.get("name") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      price: Number(formData.get("price") || 0),
      cost: Number(formData.get("cost") || 0),
      stock: Number(formData.get("stock") || 0),
    };

    try {
      if (editState.productId) {
        const result = await apiRequest(`/api/products/${editState.productId}`, {
          method: "PUT",
          body: JSON.stringify(productPayload),
        });

        data.products = data.products.map((product) =>
          product.id === editState.productId ? result.product : product
        );

        data.sales.forEach((sale) => {
          if (sale.productId === result.product.id) {
            sale.product = result.product.name;
            sale.price = Number(result.product.price || 0);
            sale.total = Number(sale.quantity || 0) * Number(result.product.price || 0);
          }
        });

        clearEditMode("product");
      } else {
        const result = await apiRequest("/api/products", {
          method: "POST",
          body: JSON.stringify(productPayload),
        });

        data.products.push(result.product);
      }

      saveData();
      event.target.reset();
      renderAll();
    } catch (err) {
      alert(err.message);
    }
  },
  true
);

deleteSale = function deleteSaleServerBacked(saleId) {
  return (async () => {
    const sale = data.sales.find((item) => item.id === saleId);

    if (!sale) return;

    if (!confirmDelete("Er du sikker pa at du vil slette dette salget?")) return;

    try {
      const result = await apiRequest(`/api/sales/${saleId}`, { method: "DELETE" });
      data.sales = data.sales.filter((item) => item.id !== saleId);
      mergeServerProducts(result.products);

      if (editState.saleId === saleId) {
        cancelEditSale();
      }

      saveData();
      renderAll();
    } catch (err) {
      alert(err.message);
    }
  })();
};

document.querySelector("#sale-form").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const formData = new FormData(event.target);
    const selectedProductId = formData.get("productId");
    const selectedProduct = getProductById(selectedProductId);
    const productName =
      selectedProduct?.name || String(formData.get("product") || "").trim();

    if (!productName) {
      alert("Produkt/tjeneste ma fylles inn eller velges.");
      return;
    }

    const salePayload = {
      customerName: String(formData.get("customer") || "").trim(),
      contactId: "",
      productId: selectedProductId || "",
      product: productName,
      quantity: Number(formData.get("quantity") || 0),
      price: Number(formData.get("price") || 0),
      status: String(formData.get("status") || "").trim(),
    };

    try {
      if (editState.saleId) {
        const result = await apiRequest(`/api/sales/${editState.saleId}`, {
          method: "PUT",
          body: JSON.stringify(salePayload),
        });

        data.sales = data.sales.map((sale) =>
          sale.id === editState.saleId ? result.sale : sale
        );
        mergeServerProducts(result.products);
        clearEditMode("sale");
      } else {
        const result = await apiRequest("/api/sales", {
          method: "POST",
          body: JSON.stringify(salePayload),
        });

        data.sales.push(result.sale);
        mergeServerProducts(result.products);
      }

      saveData();
      event.target.reset();
      renderAll();
    } catch (err) {
      alert(err.message);
    }
  },
  true
);

deletePurchase = function deletePurchaseServerBacked(purchaseId) {
  return (async () => {
    if (!confirmDelete("Er du sikker pa at du vil slette dette innkjopet?")) return;

    try {
      await apiRequest(`/api/purchases/${purchaseId}`, { method: "DELETE" });
      data.purchases = data.purchases.filter((item) => item.id !== purchaseId);

      if (editState.purchaseId === purchaseId) {
        cancelEditPurchase();
      }

      saveData();
      renderAll();
    } catch (err) {
      alert(err.message);
    }
  })();
};

document.querySelector("#purchase-form").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const formData = new FormData(event.target);
    const purchasePayload = {
      supplierName: String(formData.get("supplier") || "").trim(),
      contactId: "",
      description: String(formData.get("description") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      amount: Number(formData.get("amount") || 0),
    };

    try {
      if (editState.purchaseId) {
        const result = await apiRequest(`/api/purchases/${editState.purchaseId}`, {
          method: "PUT",
          body: JSON.stringify(purchasePayload),
        });

        data.purchases = data.purchases.map((purchase) =>
          purchase.id === editState.purchaseId ? result.purchase : purchase
        );
        clearEditMode("purchase");
      } else {
        const result = await apiRequest("/api/purchases", {
          method: "POST",
          body: JSON.stringify(purchasePayload),
        });

        data.purchases.push(result.purchase);
      }

      saveData();
      event.target.reset();
      renderAll();
    } catch (err) {
      alert(err.message);
    }
  },
  true
);

document.querySelector("#budget-form").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const budgetPayload = {
      expectedSales: Number(document.querySelector("#budget-expected-sales").value || 0),
      expectedSponsors: Number(document.querySelector("#budget-expected-sponsors").value || 0),
      expectedPurchases: Number(document.querySelector("#budget-expected-purchases").value || 0),
      expectedOtherCosts: Number(document.querySelector("#budget-expected-other-costs").value || 0),
    };

    try {
      const result = await apiRequest("/api/budget", {
        method: "PUT",
        body: JSON.stringify(budgetPayload),
      });

      data.budget = { ...result.budget };
      saveData();
      renderAll();
      alert("Budsjett lagret.");
    } catch (err) {
      alert(err.message);
    }
  },
  true
);

deleteSponsor = function deleteSponsorServerBacked(sponsorId) {
  return (async () => {
    if (!confirmDelete("Er du sikker pa at du vil slette denne sponsoren?")) return;

    try {
      await apiRequest(`/api/sponsors/${sponsorId}`, { method: "DELETE" });
      data.sponsors = data.sponsors.filter((item) => item.id !== sponsorId);

      if (editState.sponsorId === sponsorId) {
        cancelEditSponsor();
      }

      saveData();
      renderAll();
    } catch (err) {
      alert(err.message);
    }
  })();
};

document.querySelector("#sponsor-form").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const formData = new FormData(event.target);
    const sponsorPayload = {
      name: String(formData.get("name") || "").trim(),
      type: String(formData.get("type") || "").trim(),
      value: Number(formData.get("value") || 0),
    };

    try {
      if (editState.sponsorId) {
        const result = await apiRequest(`/api/sponsors/${editState.sponsorId}`, {
          method: "PUT",
          body: JSON.stringify(sponsorPayload),
        });

        data.sponsors = data.sponsors.map((sponsor) =>
          sponsor.id === editState.sponsorId ? result.sponsor : sponsor
        );
        clearEditMode("sponsor");
      } else {
        const result = await apiRequest("/api/sponsors", {
          method: "POST",
          body: JSON.stringify(sponsorPayload),
        });

        data.sponsors.push(result.sponsor);
      }

      saveData();
      event.target.reset();
      renderAll();
    } catch (err) {
      alert(err.message);
    }
  },
  true
);

document.querySelector("#settings-form").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const companyPayload = {
      name: String(document.querySelector("#settings-company-name").value || "").trim(),
      school: String(document.querySelector("#settings-company-school").value || "").trim(),
    };

    try {
      const result = await apiRequest("/api/company", {
        method: "PUT",
        body: JSON.stringify(companyPayload),
      });

      data.company = {
        ...data.company,
        ...result.company,
      };
      saveData();
      renderAll();
      alert("Innstillinger lagret.");
    } catch (err) {
      alert(err.message);
    }
  },
  true
);

async function initializeApp() {
  const activeCompanyId = getActiveCompanyId();
  const activeCompany = activeCompanyId ? getCompanyById(activeCompanyId) : null;

  if (activeCompany) {
    data = migrateData(activeCompany);
  }

  try {
    await syncSessionFromServer();
    showApp();
    return;
  } catch {
    data = cloneDefaultData();
    clearActiveCompanyId();
  }

  showOnly(welcomeScreen);
}

initializeApp();
