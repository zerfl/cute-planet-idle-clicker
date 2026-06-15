import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CRAFTING_RECIPES, Recipe } from "../../data/recipes";
import { Hammer, Coins, Star, HelpCircle, Package, Layers, Sparkles } from "lucide-react";

interface CraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNight: boolean;
  life: number;
  starsCount: number;
  moonsCount: number;
  glitterDust: number;
  shootingStarsCount: number;
  craftedItems: Record<string, number>;
  onCraftItem: (recipeId: string) => void;
  formatCompactNumber: (num: number) => string;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  isOpen,
  onClose,
  isNight,
  life,
  starsCount,
  moonsCount,
  glitterDust,
  shootingStarsCount,
  craftedItems,
  onCraftItem,
  formatCompactNumber,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<"materials" | "consumables">("materials");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    CRAFTING_RECIPES.find((r) => r.category === "materials")?.id || CRAFTING_RECIPES[0].id
  );
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  // Filter recipes based on search and category
  const filteredRecipes = CRAFTING_RECIPES.filter((recipe) => {
    const matchesCategory = recipe.category === selectedCategory;
    const matchesSearch = recipe.result.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedRecipe = CRAFTING_RECIPES.find((r) => r.id === selectedRecipeId) || CRAFTING_RECIPES[0];

  // Check if player has enough ingredients
  const checkCanCraft = (recipe: Recipe): boolean => {
    const { life: reqLife, stars: reqStars, moons: reqMoons, glitter: reqGlitter, lootboxes: reqLootboxes, items: reqItems } = recipe.ingredients;

    if (reqLife && life < reqLife) return false;
    if (reqStars && starsCount < reqStars) return false;
    if (reqMoons && moonsCount < reqMoons) return false;
    if (reqGlitter && glitterDust < reqGlitter) return false;
    if (reqLootboxes && shootingStarsCount < reqLootboxes) return false;

    if (reqItems) {
      for (const [itemId, qty] of Object.entries(reqItems)) {
        const owned = craftedItems[itemId] || 0;
        if (owned < qty) return false;
      }
    }

    return true;
  };

  const selectedCanCraft = checkCanCraft(selectedRecipe);

  // Helper to fetch item name by ID
  const getItemNameById = (id: string): string => {
    if (id === "mat_stardust") return "Sternenstaub";
    const found = CRAFTING_RECIPES.find((r) => r.result.id === id);
    return found ? found.result.name : id;
  };

  const getItemEmojiById = (id: string): string => {
    if (id === "mat_stardust") return "✨";
    const found = CRAFTING_RECIPES.find((r) => r.result.id === id);
    return found ? found.result.emoji : "📦";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/65 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`modal-frame-target flex flex-col max-w-4xl w-full h-[85vh] shadow-2xl rounded-3.5xl overflow-hidden border-3 transition-colors duration-500 text-[#ffeef4] relative ${
          isNight ? "bg-[#14102d]/95 border-[#caa5fe]" : "bg-amber-50/95 border-amber-450 text-slate-800"
        }`}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b-3 flex items-center justify-between shrink-0 transition-colors duration-500 ${
          isNight ? "border-[#caa5fe]/45 bg-[#0a081e]" : "border-amber-300 bg-amber-100 text-[#2c1d0a]"
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl select-none animate-pulse">🔨</span>
            <div>
              <span className={`text-[10px] uppercase font-black tracking-wider block ${isNight ? "text-purple-300" : "text-amber-700"}`}>
                Kosmische Synthese
              </span>
              <h4 className="font-sans font-black text-sm uppercase tracking-wide">
                Sternen-Schmiede &amp; Alchemie
              </h4>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer ${
              isNight ? "bg-[#1a1738] border-2 border-[#caa5fe] text-purple-200 hover:bg-[#252148]" : "bg-white border-2 border-amber-450 text-amber-900 hover:bg-amber-100"
            }`}
          >
            ✕
          </button>
        </div>

        {/* Resources Subheader (AURA) */}
        <div className={`px-4 py-2 border-b-2 flex items-center justify-around gap-2 bg-[#09071a] text-purple-200 text-[10.5px] font-mono font-black shrink-0 ${
          !isNight && "bg-amber-100/50 border-amber-200/50 text-amber-950"
        }`}>
          <div className="flex items-center gap-1">
            <span>💖 Leben:</span>
            <span className="text-pink-300">{formatCompactNumber(life)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⭐ Sterne:</span>
            <span className="text-amber-350">{starsCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🌙 Monde:</span>
            <span className="text-purple-300">{moonsCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>✨ Glitzerstaub:</span>
            <span className="text-violet-300">{glitterDust}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🌠 Lootboxen:</span>
            <span className="text-amber-200">{shootingStarsCount}</span>
          </div>
        </div>

        {/* Body Area */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          
          {/* Left Pane: Recipes List */}
          <div className={`w-full sm:w-[45%] flex flex-col border-r-2 ${
            isNight ? "border-[#caa5fe]/20" : "border-amber-205"
          }`}>
            
            {/* Category selection */}
            <div className="p-3 shrink-0 flex gap-1.5 border-b border-purple-500/10">
              <button
                onClick={() => {
                  setSelectedCategory("materials");
                  const first = CRAFTING_RECIPES.find((r) => r.category === "materials");
                  if (first) setSelectedRecipeId(first.id);
                }}
                className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedCategory === "materials"
                    ? isNight ? "bg-purple-900/50 text-purple-200 border border-purple-500/20" : "bg-amber-200 text-amber-900 shadow-sm border border-amber-400"
                    : isNight ? "text-gray-400 hover:text-white" : "text-slate-600 hover:bg-slate-205/40"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-300" /> Rohstoffe
              </button>
              <button
                onClick={() => {
                  setSelectedCategory("consumables");
                  const first = CRAFTING_RECIPES.find((r) => r.category === "consumables");
                  if (first) setSelectedRecipeId(first.id);
                }}
                className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedCategory === "consumables"
                    ? isNight ? "bg-purple-900/50 text-purple-200 border border-purple-500/20" : "bg-amber-200 text-amber-900 shadow-sm border border-amber-400"
                    : isNight ? "text-gray-400 hover:text-white" : "text-slate-600 hover:bg-slate-205/40"
                }`}
              >
                <Package className="w-3.5 h-3.5 text-yellow-300" /> Elixiere/Boxen
              </button>
            </div>

            {/* Recipe search */}
            <div className="p-3 shrink-0 border-b border-purple-500/10">
              <input
                type="text"
                placeholder="Rezept suchen... 🔎"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-3.5 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 border ${
                  isNight 
                    ? "bg-[#181333] border-purple-500/20 text-white placeholder-slate-500 focus:ring-purple-400" 
                    : "bg-white border-amber-300 text-slate-800 placeholder-slate-400 focus:ring-amber-400"
                }`}
              />
            </div>

            {/* List */}
            <div className={`flex-1 overflow-y-auto p-2 space-y-1.5 ${isNight ? "bg-[#0b081e]" : "bg-amber-100/10"}`}>
              {filteredRecipes.map((recipe) => {
                const canCraft = checkCanCraft(recipe);
                const isSelected = selectedRecipeId === recipe.id;
                return (
                  <div
                    key={recipe.id}
                    onClick={() => setSelectedRecipeId(recipe.id)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 relative ${
                      isSelected
                        ? isNight 
                          ? "bg-purple-500/20 border-[#caa5fe]" 
                          : "bg-amber-100 border-amber-450 scale-[1.01]"
                        : isNight
                          ? "bg-[#110e2d]/65 border-purple-950/40 hover:bg-[#18143c]"
                          : "bg-white border-amber-200/60 hover:bg-amber-50"
                    }`}
                  >
                    <span className="text-2xl select-none filter drop-shadow-sm shrink-0">
                      {recipe.result.emoji}
                    </span>
                    <div className="min-w-0 flex-grow select-none">
                      <h6 className={`font-sans font-black text-[11px] leading-tight truncate ${
                        isNight ? "text-[#ffeef4]" : "text-slate-800"
                      }`}>
                        {recipe.result.name}
                      </h6>
                      <p className={`text-[9px] truncate font-medium ${isNight ? "text-[#a298cb]" : "text-slate-500"}`}>
                        {recipe.description}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {canCraft ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-450 inline-block animate-pulse align-middle" title="Schmiedbar!" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-500 inline-block align-middle" title="Fehlende Materialien" />
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredRecipes.length === 0 && (
                <div className="text-center py-10 opacity-50 text-[11px] font-bold">
                  Keine Rezepte gefunden
                </div>
              )}
            </div>
          </div>

          {/* Right Pane: Selected Recipe Detail */}
          <div className="hidden sm:flex sm:w-[55%] flex-col overflow-y-auto p-4 sm:p-6 justify-between h-full bg-[#1c183df0]/20">
            {selectedRecipe ? (
              <div className="space-y-4 flex flex-col h-full justify-between">
                
                {/* Visual Header */}
                <div className="text-center space-y-2 mt-2">
                  <span className="text-6xl select-none filter drop-shadow-md block mb-2">
                    {selectedRecipe.result.emoji}
                  </span>
                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-mono font-black uppercase tracking-wider border ${
                      selectedRecipe.category === "materials"
                        ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                    }`}>
                      {selectedRecipe.category === "materials" ? "Rohstoff / Zutat" : "Aktivierbares Item"}
                    </span>
                    <h4 className="font-sans font-black text-sm uppercase tracking-wide text-amber-300 mt-2">
                      {selectedRecipe.result.name}
                    </h4>
                    <p className={`text-[10px] sm:text-[11px] font-semibold max-w-xs mx-auto leading-normal ${
                      isNight ? "text-[#bdb8dd]" : "text-slate-600"
                    }`}>
                      {selectedRecipe.result.description}
                    </p>
                  </div>
                </div>

                {/* Ingredients List Box */}
                <div className={`p-3 rounded-2.5xl border-2 space-y-2 ${
                  isNight ? "bg-black/35 border-purple-500/10" : "bg-white border-amber-250"
                }`}>
                  <span className="text-[9px] uppercase font-mono font-black tracking-widest text-[#a298cb] block">
                    🧪 Erforderliche Zutaten:
                  </span>
                  
                  <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {/* Life ingredient */}
                    {selectedRecipe.ingredients.life && (
                      <div className="flex items-center justify-between text-xs font-mono font-black py-0.5">
                        <span className="flex items-center gap-1 text-slate-300">
                          💖 Leben
                        </span>
                        <span className={life >= selectedRecipe.ingredients.life ? "text-[#a3e635]" : "text-rose-400"}>
                          {formatCompactNumber(selectedRecipe.ingredients.life)} ({formatCompactNumber(life)})
                        </span>
                      </div>
                    )}

                    {/* Stars ingredient */}
                    {selectedRecipe.ingredients.stars && (
                      <div className="flex items-center justify-between text-xs font-mono font-black py-0.5">
                        <span className="flex items-center gap-1 text-slate-300">
                          ⭐ Sterne
                        </span>
                        <span className={starsCount >= selectedRecipe.ingredients.stars ? "text-[#a3e635]" : "text-rose-400"}>
                          {selectedRecipe.ingredients.stars} ({starsCount})
                        </span>
                      </div>
                    )}

                    {/* Moons ingredient */}
                    {selectedRecipe.ingredients.moons && (
                      <div className="flex items-center justify-between text-xs font-mono font-black py-0.5">
                        <span className="flex items-center gap-1 text-slate-300">
                          🌙 Monde
                        </span>
                        <span className={moonsCount >= selectedRecipe.ingredients.moons ? "text-[#a3e635]" : "text-rose-400"}>
                          {selectedRecipe.ingredients.moons} ({moonsCount})
                        </span>
                      </div>
                    )}

                    {/* Glitter ingredient */}
                    {selectedRecipe.ingredients.glitter && (
                      <div className="flex items-center justify-between text-xs font-mono font-black py-0.5">
                        <span className="flex items-center gap-1 text-slate-300">
                          ✨ Glitzerstaub
                        </span>
                        <span className={glitterDust >= selectedRecipe.ingredients.glitter ? "text-[#a3e635]" : "text-rose-400"}>
                          {selectedRecipe.ingredients.glitter} ({glitterDust})
                        </span>
                      </div>
                    )}

                    {/* Lootboxes ingredient */}
                    {selectedRecipe.ingredients.lootboxes && (
                      <div className="flex items-center justify-between text-xs font-mono font-black py-0.5">
                        <span className="flex items-center gap-1 text-slate-300">
                          🌠 Lootboxen
                        </span>
                        <span className={shootingStarsCount >= selectedRecipe.ingredients.lootboxes ? "text-[#a3e635]" : "text-rose-400"}>
                          {selectedRecipe.ingredients.lootboxes} ({shootingStarsCount})
                        </span>
                      </div>
                    )}

                    {/* Crafted Items ingredients */}
                    {selectedRecipe.ingredients.items && 
                      Object.entries(selectedRecipe.ingredients.items).map(([itemId, qty]) => {
                        const ownedQty = craftedItems[itemId] || 0;
                        return (
                          <div key={itemId} className="flex items-center justify-between text-xs font-mono font-black py-0.5">
                            <span className="flex items-center gap-1 text-slate-300 truncate max-w-[65%]">
                              {getItemEmojiById(itemId)} {getItemNameById(itemId)}
                            </span>
                            <span className={ownedQty >= qty ? "text-[#a3e635]" : "text-rose-400"}>
                              {qty}x ({ownedQty}x)
                            </span>
                          </div>
                        );
                    })}
                  </div>
                </div>

                {/* Inventory / Crafted details */}
                <div className="text-center font-semibold text-[10.5px] font-mono text-[#a59bcb]">
                  Bereits im Besitz: <strong className="text-white bg-purple-900/40 border border-purple-500/10 px-2 py-0.2 rounded-full ml-1">
                    {craftedItems[selectedRecipe.result.id] || 0}x
                  </strong>
                </div>

                {/* Crafting Button */}
                <button
                  onClick={() => selectedCanCraft && onCraftItem(selectedRecipe.id)}
                  disabled={!selectedCanCraft}
                  className={`w-full py-4 rounded-2.5xl font-sans font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 border-2 ${
                    selectedCanCraft
                      ? "bg-gradient-to-r from-amber-450 via-orange-500 to-pink-500 hover:from-amber-500 hover:via-orange-600 hover:to-pink-600 text-white border-yellow-300 shadow-amber-300/10"
                      : "bg-[#18152e] border-purple-500/10 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Hammer className={`w-4 h-4 ${selectedCanCraft ? "animate-bounce" : ""}`} />
                  {selectedCanCraft ? `${selectedRecipe.result.quantity}x herstellen!` : "Schmiede gesperrt"}
                </button>

              </div>
            ) : (
              <div className="text-center my-auto font-black text-sm uppercase opacity-40">
                Wähle ein Rezept
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
};
