const Supplement = require("../models/supplement.model");

const supplements = [
  {
    name: "Fish Oil (Omega-3)",
    description: "Supports heart, brain, joint health, and reduces inflammation.",
  },
  {
    name: "Vitamin D3",
    description: "Enhances mood, immune health, and metabolism.",
  },
  {
    name: "Magnesium (Glycinate or Citrate)",
    description: "Aids in muscle function, sleep quality, and stress relief.",
  },
  {
    name: "Creatine Monohydrate",
    description: "Maintains strength and lean muscle during fat loss.",
  },
  {
    name: "Protein Powder",
    description: "Boosts muscle/tissue intake and supports digestion.",
  },
  {
    name: "Probiotic",
    description: "Enhances gut health, digestion, and nutrient absorption.",
  },
  {
    name: "Caffeine or Green Tea Extract",
    description: "May slightly boost metabolism and control appetite.",
  },
  {
    name: "Ashwagandha",
    description: "Reduces stress and cortisol, indirectly supporting fat loss.",
  },
  {
    name: "Melatonin",
    description: "Promotes deeper, more restful sleep (use occasionally).",
  },
  {
    name: "L-Carnitine",
    description: "May assist in fat metabolism and energy production.",
  },
  {
    name: "CLA (Conjugated Linoleic Acid)",
    description: "Claimed to aid in fat loss and body composition (results vary).",
  },
  {
    name: "Electrolyte Supplement",
    description: "Helps maintain hydration and muscle function, especially during workouts.",
  },
  {
    name: "Fiber Supplement",
    description: "Supports digestion and promotes fullness.",
  },
  {
    name: "Apple Cider Vinegar",
    description: "May help regulate blood sugar and appetite.",
  },
  {
    name: "Zinc",
    description: "Supports immune function, hormone health, and metabolism.",
  },
  {
    name: "B-Complex Vitamins",
    description: "Helps with energy production and metabolism support.",
  },
  {
    name: "Turmeric (Curcumin)",
    description: "Anti-inflammatory; can aid recovery and joint health.",
  },
  {
    name: "Glutamine",
    description: "May aid gut health and recovery (especially during intense training).",
  },
  {
    name: "Digestive Enzymes",
    description: "Supports better nutrient absorption and reduces bloating.",
  },
];

const getSupplements = async (req, res) => {
  try {
    const dbSupplements = await Supplement.find();
    const allSupplements = [...supplements, ...dbSupplements];
    
    res.json({
      success: true,
      data: allSupplements,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Something went wrong",
      details: err.message,
    });
  }
};

module.exports = { getSupplements }; 