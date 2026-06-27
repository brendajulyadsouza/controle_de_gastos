const STORAGE_KEY = "finora-transactions";
const MONTHLY_BUDGET = 6500;
const MOTORCYCLE_GOAL = 15000;

const seedTransactions = [
  {
    id: crypto.randomUUID(),
    description: "Salario principal",
    amount: 8900,
    type: "income",
    category: "Salario",
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: crypto.randomUUID(),
    description: "Dividendos e renda fixa",
    amount: 740,
    type: "income",
    category: "Investimentos",
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: crypto.randomUUID(),
    description: "Aluguel",
    amount: 2200,
    type: "expense",
    category: "Moradia",
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: crypto.randomUUID(),
    description: "Supermercado",
    amount: 860,
    type: "expense",
    category: "Alimentacao",
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: crypto.randomUUID(),
    description: "Academia e saude",
    amount: 310,
    type: "expense",
    category: "Saude",
    date: new Date().toISOString().slice(0, 10),
  },
];

const state = {
  transactions: loadTransactions(),
};

const elements = {
  form: document.querySelector("#transactionForm"),
  date: document.querySelector("#date"),
  balanceValue: document.querySelector("#balanceValue"),
  incomeValue: document.querySelector("#incomeValue"),
  expenseValue: document.querySelector("#expenseValue"),
  savingRate: document.querySelector("#savingRate"),
  balanceHint: document.querySelector("#balanceHint"),
  transactionList: document.querySelector("#transactionList"),
  budgetPercent: document.querySelector("#budgetPercent"),
  budgetBar: document.querySelector("#budgetBar"),
  budgetText: document.querySelector("#budgetText"),
  goalPercent: document.querySelector("#goalPercent"),
  goalSaved: document.querySelector("#goalSaved"),
  goalTargetLabel: document.querySelector("#goalTargetLabel"),
  goalBar: document.querySelector("#goalBar"),
  trendPill: document.querySelector("#trendPill"),
  chart: document.querySelector("#financeChart"),
  clearButton: document.querySelector("#clearButton"),
  exportButton: document.querySelector("#exportButton"),
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

elements.date.value = new Date().toISOString().slice(0, 10);

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(elements.form);
  const transaction = {
    id: crypto.randomUUID(),
    description: formData.get("description").trim(),
    amount: Number(formData.get("amount")),
    type: formData.get("type"),
    category: formData.get("category"),
    date: formData.get("date"),
  };

  state.transactions.unshift(transaction);
  persist();
  elements.form.reset();
  elements.date.value = new Date().toISOString().slice(0, 10);
  render();
});

elements.transactionList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete]");

  if (!button) {
    return;
  }

  state.transactions = state.transactions.filter(
    (transaction) => transaction.id !== button.dataset.delete
  );
  persist();
  render();
});

elements.clearButton.addEventListener("click", () => {
  if (!state.transactions.length) {
    return;
  }

  const confirmed = confirm("Deseja apagar todas as transacoes salvas?");

  if (confirmed) {
    state.transactions = [];
    persist();
    render();
  }
});

elements.exportButton.addEventListener("click", () => {
  const rows = [
    ["Descricao", "Categoria", "Tipo", "Valor", "Data"],
    ...state.transactions.map((transaction) => [
      transaction.description,
      transaction.category,
      transaction.type === "income" ? "Receita" : "Despesa",
      transaction.amount.toFixed(2).replace(".", ","),
      transaction.date,
    ]),
  ];

  const csv = rows.map((row) => row.map(escapeCsv).join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "finora-transacoes.csv";
  link.click();
  URL.revokeObjectURL(link.href);
});

function loadTransactions() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return seedTransactions;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return seedTransactions;
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
}

function getTotals() {
  return state.transactions.reduce(
    (totals, transaction) => {
      totals[transaction.type] += transaction.amount;
      return totals;
    },
    { income: 0, expense: 0 }
  );
}

function render() {
   const totals = getTotals();
   const balance = totals.income - totals.expense;
   const savingPercentage = totals.income ? Math.max((balance / totals.income) * 100, 0) : 0;
   const budgetPercentage = Math.min((totals.expense / MONTHLY_BUDGET) * 100, 100);
   const goalPercentage = Math.min((Math.max(balance, 0) / MOTORCYCLE_GOAL) * 100, 100);

   // Animate counter updates
   animateValue(elements.balanceValue, parseFloat(elements.balanceValue.textContent.replace(/[^\d,-]/g, '') || 0), balance);
   animateValue(elements.incomeValue, parseFloat(elements.incomeValue.textContent.replace(/[^\d,-]/g, '') || 0), totals.income);
   animateValue(elements.expenseValue, parseFloat(elements.expenseValue.textContent.replace(/[^\d,-]/g, '') || 0), totals.expense);
   animateValue(elements.savingRate, parseFloat(elements.savingRate.textContent) || 0, savingPercentage);
   animateValue(elements.goalPercent, parseFloat(elements.goalPercent.textContent) || 0, goalPercentage);
   animateValue(elements.goalSaved, parseFloat(elements.goalSaved.textContent.replace(/[^\d,-]/g, '') || 0), Math.max(balance, 0));

   elements.goalTargetLabel.textContent = `${currency.format(Math.max(balance, 0))} de ${currency.format(MOTORCYCLE_GOAL)}`;
   elements.goalBar.style.width = `${goalPercentage}%`;

   elements.balanceHint.textContent = balance >= 0 ? "Carteira positiva" : "Ajuste necessario";
   elements.trendPill.textContent = balance >= totals.income * 0.2 ? "Saudavel" : balance >= 0 ? "Atencao" : "Critico";

   elements.budgetPercent.textContent = `${Math.round(budgetPercentage)}%`;
   elements.budgetBar.style.width = `${budgetPercentage}%`;
   elements.budgetText.textContent = `${currency.format(totals.expense)} usados de ${currency.format(MONTHLY_BUDGET)} planejados.`;

   // Add animation classes to trigger counter animations
   elements.balanceValue.classList.add('animate');
   elements.incomeValue.classList.add('animate');
   elements.expenseValue.classList.add('animate');
   elements.savingRate.classList.add('animate');
   elements.goalPercent.classList.add('animate');
   elements.goalSaved.classList.add('animate');
   
   // Remove animation classes after animation ends
   setTimeout(() => {
      elements.balanceValue.classList.remove('animate');
      elements.incomeValue.classList.remove('animate');
      elements.expenseValue.classList.remove('animate');
      elements.savingRate.classList.remove('animate');
      elements.goalPercent.classList.remove('animate');
      elements.goalSaved.classList.remove('animate');
   }, 800);

   renderTransactions();
   renderChart();
}

// Helper function to animate number counting
function animateValue(element, start, end) {
   const startVal = parseFloat(start);
   const endVal = parseFloat(end);
   const duration = 800; // ms
   const startTime = performance.now();

   function updateTimestamp(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutCubic)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      let currentValue;
      if (element === elements.savingRate || element === elements.goalPercent) {
         // For percentages
         currentValue = Math.round(startVal + (endVal - startVal) * easedProgress);
         element.textContent = `${currentValue}%`;
      } else if (element === elements.balanceValue || element === elements.incomeValue || 
                element === elements.expenseValue || element === elements.goalSaved) {
         // For currency values
         currentValue = startVal + (endVal - startVal) * easedProgress;
         element.textContent = currency.format(currentValue);
      }
      
      if (progress < 1) {
         requestAnimationFrame(updateTimestamp);
      }
   }
   
   requestAnimationFrame(updateTimestamp);
}

function renderTransactions() {
  if (!state.transactions.length) {
    elements.transactionList.innerHTML = '<div class="empty-state">Nenhuma transacao ainda. Adicione uma para iniciar seu controle.</div>';
    return;
  }

  elements.transactionList.innerHTML = state.transactions
    .map((transaction) => {
      const isIncome = transaction.type === "income";
      const signal = isIncome ? "+" : "-";
      const date = dateFormatter.format(new Date(`${transaction.date}T00:00:00`));

      return `
        <article class="transaction-item">
          <span class="transaction-icon ${transaction.type}">${isIncome ? "R" : "D"}</span>
          <span class="transaction-name">
            <strong>${sanitize(transaction.description)}</strong>
            <small>${sanitize(transaction.category)} - ${date}</small>
          </span>
          <span class="transaction-value ${transaction.type}">${signal} ${currency.format(transaction.amount)}</span>
          <button class="delete-button" type="button" data-delete="${transaction.id}" aria-label="Excluir transacao">x</button>
        </article>
      `;
    })
    .join("");
}

function renderChart() {
  const canvas = elements.chart;
  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = rect.width * ratio;
  canvas.height = 260 * ratio;
  context.scale(ratio, ratio);
  context.clearRect(0, 0, rect.width, 260);

  const monthlyData = buildMonthlyData();
  const padding = 34;
  const chartHeight = 178;
  const chartTop = 30;
  const barGroupWidth = (rect.width - padding * 2) / monthlyData.length;
  const maxValue = Math.max(...monthlyData.flatMap((item) => [item.income, item.expense]), 1);

  drawGrid(context, rect.width, chartTop, chartHeight, padding);

  monthlyData.forEach((item, index) => {
    const x = padding + index * barGroupWidth + barGroupWidth * 0.18;
    const incomeHeight = (item.income / maxValue) * chartHeight;
    const expenseHeight = (item.expense / maxValue) * chartHeight;
    const barWidth = Math.max(barGroupWidth * 0.2, 12);
    const baseY = chartTop + chartHeight;

    drawRoundedBar(context, x, baseY - incomeHeight, barWidth, incomeHeight, "#10b981");
    drawRoundedBar(context, x + barWidth + 8, baseY - expenseHeight, barWidth, expenseHeight, "#ef4444");

    context.fillStyle = "rgba(244, 239, 228, 0.68)";
    context.font = "700 11px Manrope, sans-serif";
    context.textAlign = "center";
    context.fillText(item.label, x + barWidth, 242);
  });

  context.fillStyle = "rgba(244, 239, 228, 0.78)";
  context.font = "800 12px Manrope, sans-serif";
  context.textAlign = "left";
  context.fillText("Receitas", padding, 16);
  context.fillStyle = "#10b981";
  context.fillRect(padding + 58, 7, 10, 10);
  context.fillStyle = "rgba(244, 239, 228, 0.78)";
  context.fillText("Despesas", padding + 86, 16);
  context.fillStyle = "#ef4444";
  context.fillRect(padding + 150, 7, 10, 10);
}

function buildMonthlyData() {
  const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  const now = new Date();
  const months = labels.map((label, index) => ({
    label,
    month: index,
    income: 0,
    expense: 0,
  }));

  state.transactions.forEach((transaction) => {
    const date = new Date(`${transaction.date}T00:00:00`);

    if (date.getFullYear() === now.getFullYear() && date.getMonth() < months.length) {
      months[date.getMonth()][transaction.type] += transaction.amount;
    }
  });

  return months;
}

function drawGrid(context, width, top, height, padding) {
  context.strokeStyle = "rgba(255, 255, 255, 0.09)";
  context.lineWidth = 1;

  for (let index = 0; index <= 4; index += 1) {
    const y = top + (height / 4) * index;
    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
  }
}

function drawRoundedBar(context, x, y, width, height, color) {
  const radius = Math.min(8, width / 2, height / 2);

  context.fillStyle = color;
  context.beginPath();
  context.roundRect(x, y, width, height || 2, radius);
  context.fill();
}

function sanitize(value) {
   const div = document.createElement("div");
   div.textContent = value;
   return div.innerHTML;
}

function escapeCsv(value) {
   return `"${String(value).replaceAll('"', '""')}"`;
}

function animateValue(element, start, end) {
   const startVal = parseFloat(start);
   const endVal = parseFloat(end);
   const duration = 800; // ms
   const startTime = performance.now();

   function updateTimestamp(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutCubic)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      let currentValue;
      if (element === elements.savingRate || element === elements.goalPercent) {
         // For percentages
         currentValue = Math.round(startVal + (endVal - startVal) * easedProgress);
         element.textContent = `${currentValue}%`;
      } else if (element === elements.balanceValue || element === elements.incomeValue || 
                element === elements.expenseValue || element === elements.goalSaved) {
         // For currency values
         currentValue = startVal + (endVal - startVal) * easedProgress;
         element.textContent = currency.format(currentValue);
      }
      
      if (progress < 1) {
         requestAnimationFrame(updateTimestamp);
      }
   }
   
   requestAnimationFrame(updateTimestamp);
}

window.addEventListener("resize", renderChart);
render();