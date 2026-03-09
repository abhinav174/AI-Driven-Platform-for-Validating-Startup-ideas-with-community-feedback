const fs = require("fs");
const path = require("path");

const DATASET_PATH = path.join(__dirname, "..", "..", "data", "startup_funding.csv");

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "into",
  "is", "it", "of", "on", "or", "that", "the", "their", "this", "to", "with", "your"
]);

const INDUSTRY_KEYWORDS = {
  FinTech: ["fintech", "finance", "lending", "bank", "payments", "wallet", "insurance", "invoice", "expense", "accounting"],
  HealthTech: ["health", "medical", "clinic", "patient", "wellness", "diagnostic", "fitness", "doctor"],
  EdTech: ["education", "learning", "student", "school", "course", "training", "upskilling", "campus"],
  SaaS: ["saas", "workflow", "crm", "automation", "analytics", "dashboard", "productivity", "software", "platform"],
  ECommerce: ["commerce", "ecommerce", "marketplace", "retail", "shopping", "seller", "delivery", "grocery"],
  AI: ["ai", "ml", "machine", "vision", "llm", "copilot", "automation", "intelligence", "assistant"],
  ConsumerTech: ["consumer", "lifestyle", "social", "creator", "community", "home", "travel", "roommates"],
  Logistics: ["logistics", "supply", "warehouse", "fleet", "shipping", "fulfillment", "transport"],
  ClimateTech: ["climate", "energy", "solar", "carbon", "battery", "sustainability"],
  FoodTech: ["food", "restaurant", "kitchen", "meal", "grocery"]
};

const DATASET_CATEGORY_RULES = {
  FinTech: ["fintech", "finance", "accounting", "insurance", "payments", "compliance"],
  HealthTech: ["health", "wellness", "health care", "medical"],
  EdTech: ["edtech", "education", "university", "career platform"],
  SaaS: ["saas", "information technology", "customer service platform", "tech", "software"],
  ECommerce: ["e-commerce", "retail", "social commerce", "consumer goods"],
  AI: ["artificial intelligence", "conversational ai", "speech recognition", "deep-technology", "big data"],
  ConsumerTech: ["consumer technology", "services", "luxury label", "travel"],
  Logistics: ["transport", "transportation", "logistics", "automotive", "fleet"],
  ClimateTech: ["energy", "iot"],
  FoodTech: ["food and beverage", "foodtech", "grocery", "food"]
};

let cachedDataset;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        value += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(value);
      if (row.some((cell) => cell !== "")) {
        rows.push(row);
      }
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function normalizeAmount(amount) {
  const digits = String(amount || "").replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(digits);
  return Number.isFinite(parsed) ? parsed : 0;
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

function mapDatasetIndustry(industry, subVertical = "") {
  const haystack = `${industry} ${subVertical}`.toLowerCase();

  for (const [category, keywords] of Object.entries(DATASET_CATEGORY_RULES)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return category;
    }
  }

  return "SaaS";
}

function getDataset() {
  if (cachedDataset) {
    return cachedDataset;
  }

  const raw = fs.readFileSync(DATASET_PATH, "utf8");
  const [header, ...rows] = parseCsv(raw);
  const indexes = Object.fromEntries(header.map((column, index) => [column, index]));

  const startups = rows.map((row) => {
    const industry = row[indexes["Industry Vertical"]] || row[indexes["SubVertical"]] || "General";
    const subVertical = row[indexes["SubVertical"]] || "";

    return {
      name: row[indexes["Startup Name"]] || "Unknown Startup",
      industry,
      category: mapDatasetIndustry(industry, subVertical),
      subVertical,
      city: row[indexes["City  Location"]] || "Unknown",
      investors: row[indexes["Investorsxe2x80x99 Name"]] || "Undisclosed",
      amount: normalizeAmount(row[indexes["Amount in USD"]])
    };
  });

  const industries = {};
  for (const startup of startups) {
    const key = startup.category;
    if (!industries[key]) {
      industries[key] = { name: key, count: 0, totalFunding: 0, cities: {} };
    }
    industries[key].count += 1;
    industries[key].totalFunding += startup.amount;
    industries[key].cities[startup.city] = (industries[key].cities[startup.city] || 0) + 1;
  }

  cachedDataset = { startups, industries };
  return cachedDataset;
}

function chooseIndustry(tokens, text) {
  let bestIndustry = "SaaS";
  let bestScore = 0;

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const score = keywords.reduce((total, keyword) => total + (tokens.includes(keyword) || text.includes(keyword) ? 1 : 0), 0);
    if (score > bestScore) {
      bestIndustry = industry;
      bestScore = score;
    }
  }

  return bestIndustry;
}

function detectSignals(title, description, tokens, industry) {
  const text = `${title} ${description}`.toLowerCase();

  const audience =
    /student|school|college|campus/.test(text) ? "students" :
    /doctor|clinic|patient|hospital/.test(text) ? "patients and providers" :
    /sme|small business|merchant|founder|team|company|business/.test(text) ? "business teams" :
    /creator|influencer/.test(text) ? "creators" :
    /roommate|friends|family|consumer|user/.test(text) ? "consumers" :
    "early adopters";

  const revenueModel =
    /subscription|monthly|annual|membership|saas/.test(text) ? "subscription" :
    /commission|take rate|marketplace/.test(text) ? "commission" :
    /ads|advertising/.test(text) ? "ads" :
    /transaction fee|fee|payment/.test(text) ? "transaction fee" :
    /license|enterprise/.test(text) ? "enterprise sales" :
    "unclear";

  const deliveryModel =
    /mobile|app|android|ios/.test(text) ? "mobile app" :
    /marketplace|platform/.test(text) ? "platform" :
    /api|integration|dashboard/.test(text) ? "software workflow" :
    /device|hardware|iot/.test(text) ? "hardware-enabled product" :
    "web product";

  const coreProblem =
    /expense|split|payment|invoice|budget/.test(text) ? "shared money management" :
    /learning|education|career|interview|mentor/.test(text) ? "education and career progress" :
    /health|wellness|patient|care/.test(text) ? "health access and outcomes" :
    /logistics|delivery|shipping|fleet/.test(text) ? "operations coordination" :
    /creator|community|social/.test(text) ? "audience engagement" :
    /automation|workflow|productivity/.test(text) ? "workflow efficiency" :
    "a recurring user pain point";

  return {
    text,
    audience,
    revenueModel,
    deliveryModel,
    coreProblem,
    isB2B: /sme|small business|team|company|business|enterprise|merchant/.test(text),
    isB2C: /consumer|student|patient|friends|roommate|family|creator/.test(text),
    communityDriven: /community|network|social|peer|alumni|creator/.test(text),
    marketplace: /marketplace|buyer|seller|commission/.test(text),
    aiHeavy: /ai|llm|ml|machine|vision|model|copilot/.test(text) || industry === "AI",
    regulated: /finance|bank|lending|insurance|health|patient|medical/.test(text),
    hardware: /hardware|iot|device/.test(text),
    mobileFirst: /mobile|android|ios|app/.test(text),
    integrations: /integration|api|slack|whatsapp|erp|crm/.test(text),
    trustSensitive: /payment|money|health|identity|privacy|security/.test(text)
  };
}

function rankCompetitors(tokens, industry, signals) {
  const { startups } = getDataset();

  return startups
    .map((startup) => {
      const candidateTokens = tokenize(`${startup.name} ${startup.industry} ${startup.subVertical}`);
      const overlap = candidateTokens.filter((token) => tokens.includes(token)).length;
      const industryMatch = startup.category === industry ? 3 : 0;
      const audienceMatch = signals.marketplace && /marketplace|commerce/.test(`${startup.industry} ${startup.subVertical}`.toLowerCase()) ? 2 : 0;
      const fundingWeight = startup.amount > 0 ? Math.min(startup.amount / 20000000, 4) : 0;

      return { ...startup, similarity: overlap * 9 + industryMatch * 8 + audienceMatch * 6 + fundingWeight };
    })
    .filter((startup) => startup.similarity > 5)
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, 4)
    .map((startup) => ({
      name: startup.name,
      industry: startup.industry,
      focus: startup.subVertical || startup.industry,
      fundingSignal: startup.amount > 0 ? `$${Math.round(startup.amount / 100000) / 10}M disclosed funding` : "Funding not publicly disclosed",
      similarity: Math.min(98, Math.round(startup.similarity))
    }));
}

function estimateBudget(signals, industry) {
  let min = 10000;
  let max = 26000;

  if (signals.aiHeavy) {
    min += 9000;
    max += 22000;
  }
  if (signals.marketplace) {
    min += 10000;
    max += 18000;
  }
  if (signals.hardware) {
    min += 18000;
    max += 40000;
  }
  if (signals.regulated) {
    min += 8000;
    max += 20000;
  }
  if (signals.integrations) {
    min += 5000;
    max += 12000;
  }
  if (industry === "SaaS" && !signals.marketplace) {
    min += 4000;
    max += 9000;
  }

  return {
    range: `$${min.toLocaleString()} - $${max.toLocaleString()}`,
    breakdown: uniq([
      `Product build: $${Math.round(min * 0.45).toLocaleString()} - $${Math.round(max * 0.5).toLocaleString()}`,
      signals.marketplace ? `Supply and demand activation: $${Math.round(min * 0.18).toLocaleString()} - $${Math.round(max * 0.2).toLocaleString()}` : `Go-to-market tests: $${Math.round(min * 0.2).toLocaleString()} - $${Math.round(max * 0.2).toLocaleString()}`,
      signals.regulated ? `Compliance and security: $${Math.round(min * 0.15).toLocaleString()} - $${Math.round(max * 0.18).toLocaleString()}` : `Ops and tooling: $${Math.round(min * 0.15).toLocaleString()} - $${Math.round(max * 0.15).toLocaleString()}`,
      `Buffer for pivots: $${Math.round(min * 0.2).toLocaleString()} - $${Math.round(max * 0.15).toLocaleString()}`
    ])
  };
}

function buildRisks(description, competitors, signals) {
  const risks = [];

  if (description.length < 180) {
    risks.push("The problem statement is still broad, so buyers may not immediately understand the must-have use case.");
  }
  if (signals.revenueModel === "unclear") {
    risks.push("The monetization path is still vague, which makes it harder to prioritize features and unit economics.");
  }
  if (signals.marketplace) {
    risks.push("You will need to solve supply-demand balance early or the marketplace can feel empty on one side.");
  }
  if (signals.communityDriven) {
    risks.push(`Retention may depend on community behavior, so ${signals.audience} need a reason to return even before network effects kick in.`);
  }
  if (signals.aiHeavy) {
    risks.push("The product depends on AI quality, so inconsistent outputs or inference cost could hurt trust and margins.");
  }
  if (signals.regulated) {
    risks.push("This category carries trust, compliance, and data-protection expectations that can slow launches if ignored.");
  }
  if (signals.mobileFirst) {
    risks.push("A mobile-first flow must feel instant and low-friction, or users may abandon the product after first use.");
  }
  if (competitors.length >= 2) {
    risks.push(`The space already has visible players like ${competitors[0].name}, so differentiation has to be sharper than convenience alone.`);
  }

  return uniq(risks).slice(0, 4);
}

function buildInitialProblems(signals) {
  const problems = [
    `Finding the first 10-15 ${signals.audience} who will test the product repeatedly and give blunt feedback.`,
    `Reducing the MVP to one high-friction ${signals.coreProblem} workflow instead of shipping a broad feature list.`
  ];

  if (signals.marketplace) {
    problems.push("Designing an onboarding loop that gives value before the marketplace reaches liquidity.");
  }
  if (signals.regulated) {
    problems.push("Collecting sensitive data safely and explaining trust, privacy, and policy boundaries clearly.");
  }
  if (signals.aiHeavy) {
    problems.push("Defining where AI helps the user meaningfully instead of becoming a flashy but unreliable layer.");
  }
  if (signals.isB2B) {
    problems.push("Turning founder conversations into pilots with one team that has a clear buying owner.");
  }
  if (signals.isB2C) {
    problems.push("Converting curiosity into a repeat behavior metric such as weekly active users, referrals, or paid upgrades.");
  }

  return uniq(problems).slice(0, 4);
}

function buildAdvice(competitors, signals) {
  const advice = [
    `Start with a narrow segment of ${signals.audience} and position the product around one painful moment in ${signals.coreProblem}.`,
    `Make the first release optimize for ${signals.deliveryModel} simplicity rather than a long feature checklist.`
  ];

  if (signals.revenueModel !== "unclear") {
    advice.push(`Validate willingness to pay for a ${signals.revenueModel} model before scaling acquisition.`);
  } else {
    advice.push("Test a pricing hypothesis early so the business model is validated alongside product demand.");
  }
  if (competitors.length > 0) {
    advice.push(`Differentiate clearly from ${competitors[0].name} through a niche audience, faster setup, or a stronger outcome promise.`);
  }
  if (signals.regulated) {
    advice.push("Bring compliance, consent, and security messaging into the MVP instead of treating them as later polish.");
  }
  if (signals.marketplace) {
    advice.push("Seed one side of the network manually first so the product feels alive before wider launch.");
  }

  return uniq(advice).slice(0, 4);
}

function marketSnapshot(industry) {
  const { industries } = getDataset();
  const matchingIndustry = industries[industry] || { name: industry, count: 0, totalFunding: 0, cities: {} };
  const topCity = Object.entries(matchingIndustry.cities).sort((left, right) => right[1] - left[1])[0] || [];

  return {
    industry,
    startupActivity: `${matchingIndustry.count} related funding entries mapped to ${industry} in the dataset`,
    capitalSignal: matchingIndustry.totalFunding > 0 ? `$${Math.round(matchingIndustry.totalFunding / 1000000).toLocaleString()}M+ total disclosed funding across this category` : "Limited funding signal in the dataset",
    hotspot: topCity[0] ? `${topCity[0]} appears frequently for this category` : "No clear location hotspot"
  };
}

function scoreIdea(description, industry, competitors, signals) {
  const { industries } = getDataset();
  const matchingIndustry = industries[industry] || { count: 10, totalFunding: 50000000 };

  const clarityScore = Math.min(24, Math.round(description.length / 18));
  const revenueScore = signals.revenueModel === "unclear" ? 6 : 14;
  const marketScore = Math.min(22, Math.round(matchingIndustry.count / 5) + Math.round(matchingIndustry.totalFunding / 100000000));
  const moatScore = signals.aiHeavy || signals.communityDriven || signals.integrations ? 13 : 8;
  const executionPenalty = (signals.hardware ? 8 : 0) + (signals.regulated ? 6 : 0) + (signals.marketplace ? 5 : 0);
  const crowdingPenalty = competitors.length > 0 ? Math.min(12, Math.round(competitors[0].similarity / 10)) : 3;

  return Math.max(35, Math.min(95, 42 + clarityScore + revenueScore + marketScore + moatScore - executionPenalty - crowdingPenalty));
}

function verdictForScore(score) {
  if (score >= 80) return "Strong potential";
  if (score >= 68) return "Promising with validation work";
  if (score >= 55) return "Needs sharper positioning";
  return "High risk at current stage";
}

function buildSummary(score, signals, competitors) {
  if (score >= 78) {
    return `The idea addresses ${signals.coreProblem} with a plausible angle, but execution quality and early user focus will decide whether it stands out.`;
  }
  if (competitors.length > 0) {
    return `The concept is relevant, but it needs a stronger wedge against existing players and a tighter first-user promise.`;
  }
  return `The concept is interesting, though it still needs clearer positioning, sharper proof of demand, and a more concrete launch wedge.`;
}

function analyzeIdea(title, description) {
  const combined = `${title} ${description}`.toLowerCase();
  const tokens = tokenize(combined);
  const industry = chooseIndustry(tokens, combined);
  const signals = detectSignals(title, description, tokens, industry);
  const competitors = rankCompetitors(tokens, industry, signals);
  const score = scoreIdea(description, industry, competitors, signals);
  const budget = estimateBudget(signals, industry);

  return {
    score,
    verdict: verdictForScore(score),
    riskLevel: score >= 78 ? "Moderate" : score >= 60 ? "Medium-high" : "High",
    industry,
    budget,
    market: marketSnapshot(industry),
    competitors,
    risks: buildRisks(description, competitors, signals),
    initialProblems: buildInitialProblems(signals),
    advice: buildAdvice(competitors, signals),
    summary: buildSummary(score, signals, competitors)
  };
}

module.exports = { analyzeIdea };

