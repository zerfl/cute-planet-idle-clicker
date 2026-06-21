export interface BlackHoleGambleResult {
  success: boolean;
  roll?: number;
  outcomeType?: "good" | "bad";
  title?: string;
  text?: string;
  error?: string;
}

/**
 * Executes black hole gamble logic. Modifies state in-place.
 */
export function executeBlackHoleGamble(
  state: any,
  sacrificeType: "life" | "stars" | "dust",
  getLpsAndStats: (state: any) => any,
  setupActiveEvent: (eventId: string) => void,
): BlackHoleGambleResult {
  let cost = 0;
  let ok = false;
  if (sacrificeType === "life") {
    // Sacrifice 50% of life, minimum 10 million
    cost = Math.floor(state.life * 0.5);
    if (cost < 10000000) cost = 10000000;
    if (state.life >= cost) {
      state.life -= cost;
      ok = true;
    }
  } else if (sacrificeType === "stars") {
    // Sacrifice 25% of stars, minimum 10
    cost = Math.ceil(state.starsCount * 0.25);
    if (cost < 10) cost = 10;
    if (state.starsCount >= cost) {
      state.starsCount -= cost;
      ok = true;
    }
  } else if (sacrificeType === "dust") {
    // Sacrifice 50% of glitter dust, minimum 10
    cost = Math.ceil((state.glitterDust || 0) * 0.5);
    if (cost < 10) cost = 10;
    if ((state.glitterDust || 0) >= cost) {
      state.glitterDust -= cost;
      ok = true;
    }
  }

  if (!ok) {
    return {
      success: false,
      error: "Nicht genügend Ressourcen für diese Opfergabe!",
    };
  }

  // Roll outcome with equal 5% chance (20 options: 0-9 good, 10-19 bad)
  const roll = Math.floor(Math.random() * 20);
  let titleGerman = "";
  let textGerman = "";
  let type: "good" | "bad" = "good";

  const stats = getLpsAndStats(state);
  const baseLps = stats.totalStarsLps || 100;
  const holeMultiplier = 1 + ((state.blackHoleSize || 1) - 1) * 0.25;

  switch (roll) {
    // --- GOOD OUTCOMES (0 to 9) ---
    case 0: {
      // RIESIGER BONUS
      type = "good";
      titleGerman = "Singularitäts-Segen 🌌";
      if (sacrificeType === "life") {
        const reward = Math.floor(baseLps * 12000 * holeMultiplier);
        state.life += reward;
        state.totalLifeEarned += reward;
        textGerman = `Das Schwarze Loch spuckt einen gewaltigen Lebensschwarm aus! Du erhältst +${reward.toLocaleString("de-DE")} 💖 Leben!`;
      } else if (sacrificeType === "stars") {
        const reward = Math.floor(50 * holeMultiplier);
        state.starsCount += reward;
        textGerman = `Eine stellare Explosion schleudert Edelsteine heraus! Du erhältst +${reward} ⭐ Sterne!`;
      } else {
        const reward = Math.floor(40 * holeMultiplier);
        state.glitterDust += reward;
        textGerman = `Ein Regen aus reinem Kristallstaub bricht aus! Du erhältst +${reward} 💫 Kosmischen Glitzerstaub!`;
      }
      break;
    }
    case 1: {
      // SELTENES COSMETIC
      type = "good";
      titleGerman = "Kosmischer Fund 🎁";
      const allPossible = [
        "star_pink",
        "acc_flower_crown",
        "moon_sakura",
        "star_cyber",
        "acc_space_glasses",
        "moon_cyber",
        "star_gold",
        "acc_star_crown",
        "moon_gold",
        "star_ghostly",
        "frame_ghost",
        "moon_ghost",
        "star_butterfly",
        "acc_butterfly_wings",
        "frame_butterfly",
        "moon_butterfly",
      ];
      const locked = allPossible.filter((id) => !state.unlockedCosmetics.includes(id));
      if (locked.length > 0) {
        const chosenCosmeticId = locked[Math.floor(Math.random() * locked.length)];
        state.unlockedCosmetics.push(chosenCosmeticId);
        textGerman = `Ein schwebendes Artefakt nähert sich aus der dunklen Zone! Du schaltetest ein seltenes Cosmetic frei: "${chosenCosmeticId.replace(/_/g, " ").toUpperCase()}"! 🎨`;
      } else {
        const fallbackDust = Math.floor(75 * holeMultiplier);
        state.glitterDust += fallbackDust;
        textGerman = `Da du bereits alle Kosmetika besitzt, erstrahlt der Fund in reinem Glitzerstaub! Du erhältst +${fallbackDust} 💫 Glitzerstaub!`;
      }
      break;
    }
    case 2: {
      // PRESTIGE-WÄHRUNG
      type = "good";
      titleGerman = "Quanten-Aufstieg 🎖️";
      state.prestigeCount = (state.prestigeCount || 0) + 1;
      textGerman =
        "Eine geheimnisvolle Hyperdimension faltet sich! Du erhältst +1 dauerhaftes Prestige-Level OHNE dein aktuelles Spiel zurückzusetzen!";
      break;
    }
    case 3: {
      // EVENT SOFORT STARTEN
      type = "good";
      titleGerman = "Akkretions-Ausbruch 💥";
      setupActiveEvent("hyper_star");
      state.eventTimeRemaining = 180;
      textGerman =
        "Das Schwarze Loch destabilisiert sich und bricht in einem Hyperriesen-Ausbruch aus! Ein 180-sekündiges kosmisches Event hat sofort begonnen!";
      break;
    }
    case 4: {
      // SCHWARZES LOCH WIRD GRÖSSER
      type = "good";
      titleGerman = "Singularitäts-Wachstum 📈";
      state.blackHoleSize = (state.blackHoleSize || 1) + 1;
      textGerman = `Das Schwarze Loch verschlingt deine Opfergabe vollständig und dehnt seinen Ereignishorizont aus! Es wächst auf Stufe ${state.blackHoleSize}. Zukünftige gute Belohnungen steigen dauerhaft um +25%!`;
      break;
    }
    case 5: {
      // NEW GOOD 1: SHOOTING STARS GIFT
      type = "good";
      titleGerman = "Sternenregen-Symphonie 🌠";
      const rewardStars = Math.floor((3 + Math.floor(Math.random() * 5)) * holeMultiplier);
      state.shootingStarsCount = (state.shootingStarsCount || 0) + rewardStars;
      textGerman = `Eine harmonische Erschütterung lässt Sternenstaub kondensieren! Du erhältst +${rewardStars} 🌠 Sternschnuppen-Kisten im Inventar!`;
      break;
    }
    case 6: {
      // NEW GOOD 2: GLITTER EXPLO
      type = "good";
      titleGerman = "Glitzer-Explosion 💫";
      const rewardDust = Math.floor((20 + Math.floor(Math.random() * 25)) * holeMultiplier);
      state.glitterDust = (state.glitterDust || 0) + rewardDust;
      textGerman = `Die Singularität entlädt eine funkelnde Staubwolke! Du erhältst +${rewardDust} 💫 Kosmischen Glitzerstaub!`;
      break;
    }
    case 7: {
      // NEW GOOD 3: FREE MOON / STARS
      type = "good";
      titleGerman = "Mond-Fusion 🌕";
      let maxMoons = 3;
      const upgrades = state.purchasedUpgrades || [];
      if (upgrades.includes("upg-moon-limit-1")) maxMoons++;
      if (upgrades.includes("upg-moon-limit-2")) maxMoons++;
      if (upgrades.includes("upg-moon-limit-3")) maxMoons++;
      if (upgrades.includes("upg-moon-limit-4")) maxMoons++;
      if (upgrades.includes("upg-moon-limit-5")) maxMoons++;
      if (upgrades.includes("upg-moon-limit-6")) maxMoons++;
      if (upgrades.includes("upg-moon-limit-7")) maxMoons++;
      if (state.zodiac === "mond") maxMoons++;

      if ((state.moonsCount || 0) < maxMoons) {
        state.moonsCount = (state.moonsCount || 0) + 1;
        textGerman =
          "Ein vollkommen intakter Trabant löst sich aus dem Gravitationsfeld! Du erhältst +1 🌙 Mond gratis!";
      } else {
        const fallbackStars = Math.floor(35 * holeMultiplier);
        state.starsCount = (state.starsCount || 0) + fallbackStars;
        textGerman = `Der Ereignishorizont versucht einen Mond abzuspalten, aber deine Umlaufbahnen sind voll! Stattdessen erhältst du +${fallbackStars} ⭐ Sterne!`;
      }
      break;
    }
    case 8: {
      // NEW GOOD 4: CHRONOS COMPENSATION
      type = "good";
      titleGerman = "Chronos-Kompensation ⏳";
      const reward = Math.floor(baseLps * 3600 * holeMultiplier);
      state.life += reward;
      state.totalLifeEarned += reward;
      textGerman = `Das Schwarze Loch krümmt die Zeitlinie positiv! Du erhältst die Ausbeute von 1 Stunde Slumber-Ruhe: +${reward.toLocaleString("de-DE")} 💖 Leben!`;
      break;
    }
    case 9: {
      // NEW GOOD 5: ASTRAL INFLUENCE
      type = "good";
      titleGerman = "Astral-Einfluss 🔮";
      const lifeReward = Math.floor(baseLps * 5000 * holeMultiplier);
      const starReward = Math.floor(12 * holeMultiplier);
      state.life += lifeReward;
      state.totalLifeEarned += lifeReward;
      state.starsCount += starReward;
      textGerman = `Die feindliche Gravitation harmonisiert with deinen Upgrades! Du erhältst +${lifeReward.toLocaleString("de-DE")} 💖 Leben und +${starReward} ⭐ Sterne!`;
      break;
    }

    // --- BAD OUTCOMES (10 to 19) ---
    case 10: {
      // NICHTS PASSIERT
      type = "bad";
      titleGerman = "Ewiges Schweigen 🧘";
      textGerman =
        "Das Schwarze Loch absorbiert deine Opfergabe lautlos. Nichts passiert. Nur die eisige Kälte des ewigen Nichts vibriert im Raum...";
      break;
    }
    case 11: {
      // KATASTROPHALE VERLANGSAMUNG
      type = "bad";
      titleGerman = "Zeitdilatation ⏳";
      const starsLoss = Math.min(5, state.starsCount);
      state.starsCount -= starsLoss;
      const dustLoss = Math.min(10, state.glitterDust);
      state.glitterDust -= dustLoss;
      textGerman = `Eine massive Gravitationswelle verzerrt deine planetare Schwerkraft! Du verlierst zusätzlich ${starsLoss} Sterne und ${dustLoss} Glitzerstaub!`;
      break;
    }
    case 12: {
      // LEBENS-ABSORPTION
      type = "bad";
      titleGerman = "Materie-Verschlingung 🌀";
      const lifeLoss = Math.floor(state.life * 0.15);
      state.life -= lifeLoss;
      textGerman = `Der Gravitationsstrudel ergreift deinen Planeten! Er saugt zusätzlich ${lifeLoss.toLocaleString("de-DE")} 💖 Leben direkt aus deiner Planetenkruste!`;
      break;
    }
    case 13: {
      // STERNE-VERLUST
      type = "bad";
      titleGerman = "Sternen-Vakuum ✨";
      const sLoss = Math.min(8, state.starsCount);
      state.starsCount -= sLoss;
      textGerman = `Die unbarmherzige Anziehungskraft bricht Sterne aus ihrer Kreisbahn! ${sLoss} Sterne stürzen unaufhaltsam in den Abgrund der Singularität.`;
      break;
    }
    case 14: {
      // SCHWARZES LOCH SCHRUMPFT
      type = "bad";
      titleGerman = "Vakuum-Erosion 📉";
      const previousSize = state.blackHoleSize || 1;
      const newSize = Math.max(1, previousSize - 1);
      state.blackHoleSize = newSize;

      const lifeDrain = Math.floor(state.life * 0.05);
      state.life -= lifeDrain;

      if (previousSize > 1) {
        textGerman = `Das Schwarze Loch kollabiert unter seiner eigenen Last und schrumpft zurück auf Stufe ${newSize}! Du verlierst zudem ${lifeDrain.toLocaleString("de-DE")} 💖 Leben.`;
      } else {
        textGerman = `Das Schwarze Loch spuckt antimaterische Störstrahlung aus! Es kann nicht weiter schrumpfen, aber du verlierst zusätzliche ${lifeDrain.toLocaleString("de-DE")} 💖 Leben.`;
      }
      break;
    }
    case 15: {
      // NEW BAD 1: BLACK STORM
      type = "bad";
      titleGerman = "Schwarzer Kosmischer Sturm 🌪️";
      const dustLoss = Math.min(25, Math.floor((state.glitterDust || 0) * 0.4));
      if (dustLoss > 0) {
        state.glitterDust -= dustLoss;
        textGerman = `Ein hyperaktiver Gravitationssturm wirbelt deinen Staub auf! Du verlierst ${dustLoss} 💫 Glitzerstaub!`;
      } else {
        const lifeLoss = Math.floor(state.life * 0.08);
        state.life -= lifeLoss;
        textGerman = `Ein hyperaktiver Gravitationssturm hat keinen Staub gefunden! Er entzieht deinem Planeten stattdessen ${lifeLoss.toLocaleString("de-DE")} 💖 Leben!`;
      }
      break;
    }
    case 16: {
      // NEW BAD 2: EXP FREEZE
      type = "bad";
      titleGerman = "Schwerkraft-Paralyse 🧊";
      const expLoss = Math.floor(state.planetExp * 0.5);
      state.planetExp -= expLoss;
      textGerman = `Eine Gravitationsstarre friert die Entwicklung deines Planeten ein! Du verlierst ${expLoss.toLocaleString("de-DE")} Planeten-EXP (Halbierung des aktuellen Levels-Fortschritts).`;
      break;
    }
    case 17: {
      // NEW BAD 3: ANIMAL VANISH
      type = "bad";
      titleGerman = "Kosmisches Vergessen 🧠";
      let highestAnimal: string | null = null;
      let highestQty = 0;
      const animals = state.purchasedAnimals || {};
      for (const key of Object.keys(animals)) {
        if (animals[key] > highestQty) {
          highestQty = animals[key];
          highestAnimal = key;
        }
      }
      if (highestAnimal && highestQty > 0) {
        state.purchasedAnimals[highestAnimal]--;
        textGerman = `Das raue Gravitationsfeld verwirrt deine Biosphäre! Eines deiner wertvollen Tiere (${highestAnimal.toUpperCase()}) verschwindet im Hyperraum!`;
      } else {
        const lifeLoss = Math.min(state.life, 50000000);
        state.life -= lifeLoss;
        textGerman = `Das Gesetz der Schwerkraft dekomprimiert deine Planetenatmosphäre! Du verlierst ${lifeLoss.toLocaleString("de-DE")} 💖 Leben!`;
      }
      break;
    }
    case 18: {
      // NEW BAD 4: SHADOW THEFT
      type = "bad";
      titleGerman = "Schatten-Infiltration 👥";
      const starsLoss = Math.min(15, Math.floor(state.starsCount * 0.35));
      if (starsLoss > 0) {
        state.starsCount -= starsLoss;
        textGerman = `Eine schattenhafte Anomalie schlängelt sich durch den Horizont und stiehlt wertvolle Sternenkristalle! Du verlierst ${starsLoss} ⭐ Sterne.`;
      } else {
        const lifeLoss = Math.floor(state.life * 0.1);
        state.life -= lifeLoss;
        textGerman = `Eine schattenhafte Anomalie findet keine Sterne, entzieht dir aber ${lifeLoss.toLocaleString("de-DE")} 💖 Leben!`;
      }
      break;
    }
    case 19: {
      // NEW BAD 5: MOON COMPRESSION
      type = "bad";
      titleGerman = "Heisenberg-Kompression 📉";
      if ((state.moonsCount || 0) > 0) {
        state.moonsCount--;
        textGerman =
          "Eine heisenbergsche Massenkompression bricht deinen instabilsten Trabanten auseinander! Du verlierst -1 🌙 Mond!";
      } else {
        const lifeLoss = Math.floor(state.life * 0.25);
        state.life -= lifeLoss;
        textGerman = `Eine heisenbergsche Massenkompression erschüttert den Planetenkern! Du verlierst -25% deines gesamten angesammelten Lebens: -${lifeLoss.toLocaleString("de-DE")} 💖 Leben!`;
      }
      break;
    }
  }

  return {
    success: true,
    roll,
    outcomeType: type,
    title: titleGerman,
    text: textGerman,
  };
}
