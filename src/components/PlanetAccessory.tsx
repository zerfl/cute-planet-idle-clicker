import React from "react";

interface PlanetAccessoryProps {
  activeAccessory: string;
}

export const PlanetAccessory: React.FC<PlanetAccessoryProps> = React.memo(({ activeAccessory }) => {
  switch (activeAccessory) {
    case "cat_ears":
      return (
        <g id="accessory-cat-ears" className="pointer-events-none">
          <path
            d="M 42,24 L 64,5 L 76,28 Z"
            fill="#ffd1dc"
            stroke="var(--color-cosmic-border)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M 48,22 L 62,9 L 70,24 Z" fill="#fca5a5" />
          <path
            d="M 158,24 L 136,5 L 124,28 Z"
            fill="#ffd1dc"
            stroke="var(--color-cosmic-border)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M 152,22 L 138,9 L 130,24 Z" fill="#fca5a5" />
        </g>
      );
    case "chef_hat":
      return (
        <g id="accessory-chef-hat" className="pointer-events-none">
          <path
            d="M 75,25 Q 70,5 90,8 Q 100,-8 110,8 Q 130,5 125,25 Z"
            fill="#ffffff"
            stroke="var(--color-cosmic-border)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <rect
            x="80"
            y="22"
            width="40"
            height="8"
            rx="2"
            fill="#e2e8f0"
            stroke="var(--color-cosmic-border)"
            strokeWidth="2.5"
          />
        </g>
      );
    case "wizard_hat":
      return (
        <g id="accessory-wizard-hat" className="pointer-events-none" transform="rotate(-10 100 20)">
          <path
            d="M 65,22 L 100,-15 L 135,22 Z"
            fill="#3b82f6"
            stroke="#1d1e2e"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <ellipse
            cx="100"
            cy="22"
            rx="42"
            ry="6"
            fill="#1d4ed8"
            stroke="#1d1e2e"
            strokeWidth="3"
          />
          <path
            d="M 95,2 L 100,5 Q 100,2 105,2 Q 100,2 100,-1 Z"
            fill="var(--color-cosmic-yellow)"
            transform="scale(0.8) translate(15, 10)"
          />
          <path
            d="M 95,2 L 100,5 Q 100,2 105,2 Q 100,2 100,-1 Z"
            fill="var(--color-cosmic-yellow)"
            transform="scale(0.6) translate(50, 15)"
          />
        </g>
      );
    case "angel_halo":
      return (
        <g
          id="accessory-angel-halo"
          className="pointer-events-none animate-bounce"
          style={{ animationDelay: "0s" }}
        >
          <ellipse
            cx="100"
            cy="-2"
            rx="35"
            ry="8"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="4.5"
            filter="drop-shadow(0 0 4px rgba(251, 191, 36, 0.8))"
          />
          <ellipse cx="100" cy="-2" rx="35" ry="8" fill="none" stroke="#fff" strokeWidth="1.5" />
        </g>
      );
    case "space_glasses":
      return (
        <g id="accessory-space-glasses" className="pointer-events-none">
          <path
            d="M 45,74 L 58,74 L 62,62 L 67,74 L 80,74 L 70,82 L 74,94 L 62,86 L 51,94 L 55,82 Z"
            fill="rgba(6, 182, 212, 0.85)"
            stroke="#1d1e2e"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M 52,78 L 58,78 L 62,72 L 64,78 L 60,82 Z" fill="#fff" opacity="0.6" />
          <path
            d="M 120,74 L 133,74 L 137,62 L 142,74 L 155,74 L 145,82 L 149,94 L 137,86 L 126,94 L 130,82 Z"
            fill="rgba(6, 182, 212, 0.85)"
            stroke="#1d1e2e"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M 127,78 L 133,78 L 137,72 L 139,78 L 135,82 Z" fill="#fff" opacity="0.6" />
          <path d="M 80,74 Q 100,70 120,74" fill="none" stroke="#1d1e2e" strokeWidth="3" />
        </g>
      );
    case "star_crown":
      return (
        <g id="accessory-star-crown" className="pointer-events-none" transform="translate(0, 3)">
          <path
            d="M 75,22 L 80,8 L 92,15 L 100,3 L 108,15 L 120,8 L 125,22 Z"
            fill="#fbbf24"
            stroke="var(--color-cosmic-border)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle
            cx="80"
            cy="7"
            r="2.5"
            fill="#f43f5e"
            stroke="var(--color-cosmic-border)"
            strokeWidth="1"
          />
          <circle
            cx="100"
            cy="2"
            r="2.5"
            fill="#3b82f6"
            stroke="var(--color-cosmic-border)"
            strokeWidth="1"
          />
          <circle
            cx="120"
            cy="7"
            r="2.5"
            fill="#10b981"
            stroke="var(--color-cosmic-border)"
            strokeWidth="1"
          />
          <rect x="83" y="17" width="34" height="3" rx="1" fill="#fff" opacity="0.7" />
        </g>
      );
    case "detective_hat":
      return (
        <g id="accessory-detective-hat" className="pointer-events-none" transform="translate(0, 1)">
          <path
            d="M 65,22 C 65,2 135,2 135,22 Z"
            fill="#855843"
            stroke="var(--color-cosmic-border)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M 115,22 C 122,22 138,18 142,24 C 130,28 115,24 115,22 Z"
            fill="#694132"
            stroke="var(--color-cosmic-border)"
            strokeWidth="2.5"
          />
          <path
            d="M 85,22 C 78,22 62,18 58,24 C 70,28 85,24 85,22 Z"
            fill="#694132"
            stroke="var(--color-cosmic-border)"
            strokeWidth="2.5"
          />
          <rect
            x="94"
            y="10"
            width="12"
            height="13"
            fill="#e2e8f0"
            stroke="var(--color-cosmic-border)"
            strokeWidth="2"
            rx="1"
          />
          <path
            d="M 97,23 L 94,32 L 106,32 L 103,23 Z"
            fill="#cbd5e1"
            stroke="var(--color-cosmic-border)"
            strokeWidth="2"
          />
        </g>
      );
    case "flower_crown":
      return (
        <g id="accessory-flower-crown" className="pointer-events-none" transform="translate(0, 2)">
          <path
            d="M 55,24 Q 100,10 145,24"
            fill="none"
            stroke="#22c55e"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <g transform="translate(68, 20) scale(0.65)">
            <circle cx="0" cy="-5" r="4" fill="#f472b6" />
            <circle cx="0" cy="5" r="4" fill="#f472b6" />
            <circle cx="-5" cy="0" r="4" fill="#f472b6" />
            <circle cx="5" cy="0" r="4" fill="#f472b6" />
            <circle cx="0" cy="0" r="2.5" fill="var(--color-cosmic-yellow)" />
          </g>
          <g transform="translate(86, 17) scale(0.75)">
            <circle cx="0" cy="-5" r="4" fill="#fff" />
            <circle cx="0" cy="5" r="4" fill="#fff" />
            <circle cx="-5" cy="0" r="4" fill="#fff" />
            <circle cx="5" cy="0" r="4" fill="#fff" />
            <circle cx="0" cy="0" r="2.5" fill="var(--color-cosmic-yellow)" />
          </g>
          <g transform="translate(100, 16) scale(0.85)">
            <circle cx="0" cy="-5" r="4" fill="#c084fc" />
            <circle cx="0" cy="5" r="4" fill="#c084fc" />
            <circle cx="-5" cy="0" r="4" fill="#c084fc" />
            <circle cx="5" cy="0" r="4" fill="#c084fc" />
            <circle cx="0" cy="0" r="2.5" fill="#fde047" />
          </g>
          <g transform="translate(114, 17) scale(0.75)">
            <circle cx="0" cy="-5" r="4" fill="#fff" />
            <circle cx="0" cy="5" r="4" fill="#fff" />
            <circle cx="-5" cy="0" r="4" fill="#fff" />
            <circle cx="5" cy="0" r="4" fill="#fff" />
            <circle cx="0" cy="0" r="2.5" fill="var(--color-cosmic-yellow)" />
          </g>
          <g transform="translate(132, 20) scale(0.65)">
            <circle cx="0" cy="-5" r="4" fill="#f472b6" />
            <circle cx="0" cy="5" r="4" fill="#f472b6" />
            <circle cx="-5" cy="0" r="4" fill="#f472b6" />
            <circle cx="5" cy="0" r="4" fill="#f472b6" />
            <circle cx="0" cy="0" r="2.5" fill="var(--color-cosmic-yellow)" />
          </g>
        </g>
      );
    case "frog_hat":
      return (
        <g id="accessory-frog-hat" className="pointer-events-none" transform="translate(0, 1)">
          <path
            d="M 68,23 C 68,0 132,0 132,23 Z"
            fill="#4ade80"
            stroke="var(--color-cosmic-border)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle
            cx="82"
            cy="7"
            r="10"
            fill="#4ade80"
            stroke="var(--color-cosmic-border)"
            strokeWidth="2.5"
          />
          <circle cx="82" cy="7" r="6" fill="#fff" />
          <circle cx="80" cy="8" r="3.5" fill="#000" />
          <circle
            cx="118"
            cy="7"
            r="10"
            fill="#4ade80"
            stroke="var(--color-cosmic-border)"
            strokeWidth="2.5"
          />
          <circle cx="118" cy="7" r="6" fill="#fff" />
          <circle cx="120" cy="8" r="3.5" fill="#000" />
          <circle cx="78" cy="18" r="3" fill="#f43f5e" opacity="0.6" />
          <circle cx="122" cy="18" r="3" fill="#f43f5e" opacity="0.6" />
        </g>
      );
    case "cowboy_hat":
      return (
        <g id="accessory-cowboy-hat" className="pointer-events-none" transform="translate(0, -6)">
          <path
            d="M 75,20 C 72,2 88,4 100,5 C 112,4 128,2 125,20 Z"
            fill="#b45309"
            stroke="var(--color-cosmic-border)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M 75,19 Q 100,21 125,19"
            fill="none"
            stroke="var(--color-cosmic-yellow)"
            strokeWidth="3.5"
          />
          <path
            d="M 54,23 Q 100,10 146,23 C 158,26 142,20 130,19 C 112,17 88,17 70,19 C 58,20 42,26 54,23 Z"
            fill="#92400e"
            stroke="var(--color-cosmic-border)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>
      );
    case "straw_hat":
      return (
        <g id="accessory-straw-hat" className="pointer-events-none" transform="translate(0, 1)">
          <path
            d="M 75,22 Q 74,5 100,5 Q 126,5 125,22 Z"
            fill="#fde047"
            stroke="var(--color-cosmic-border)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <rect
            x="76"
            y="16"
            width="48"
            height="6"
            fill="#f43f5e"
            stroke="var(--color-cosmic-border)"
            strokeWidth="2"
          />
          <ellipse
            cx="100"
            cy="22"
            rx="46"
            ry="6"
            fill="#facc15"
            stroke="var(--color-cosmic-border)"
            strokeWidth="3"
          />
        </g>
      );
    case "sleep_cap":
      return (
        <g id="accessory-sleep-cap" className="pointer-events-none" transform="translate(0, 1)">
          <path
            d="M 75,23 C 70,10 80,-5 105,-8 C 118,-9 132,-5 130,5 C 128,15 135,18 135,23 Z"
            fill="#3b82f6"
            stroke="var(--color-cosmic-border)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M 124,0 C 138,0 152,15 145,26 C 142,28 136,22 132,18 Z"
            fill="#2563eb"
            stroke="var(--color-cosmic-border)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle
            cx="146"
            cy="28"
            r="7.5"
            fill="#ffffff"
            stroke="var(--color-cosmic-border)"
            strokeWidth="2.5"
          />
          <path
            d="M 90,4 L 92,7 L 95,7 L 93,9 L 94,12 L 91,10 L 88,12 L 89,9 L 87,7 L 90,7 Z"
            fill="#fde047"
            transform="scale(0.7) translate(25, 5)"
          />
          <path
            d="M 90,4 L 92,7 L 95,7 L 93,9 L 94,12 L 91,10 L 88,12 L 89,9 L 87,7 L 90,7 Z"
            fill="#fde047"
            transform="scale(0.6) translate(85, -2)"
          />
          <rect
            x="73"
            y="19"
            width="54"
            height="6"
            rx="2.5"
            fill="#f1f5f9"
            stroke="var(--color-cosmic-border)"
            strokeWidth="2.5"
          />
        </g>
      );
    case "pirate_hat":
      return (
        <g id="accessory-pirate-hat" className="pointer-events-none" transform="translate(0, -2)">
          <path
            d="M 60,22 Q 100,5 140,22 C 160,5 140,-4 100,-4 C 60,-4 40,5 60,22 Z"
            fill="#1e293b"
            stroke="var(--color-cosmic-bg)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path d="M 56,22 Q 100,3 144,22" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
          <g transform="translate(100, 7) scale(0.55)">
            <rect
              x="-6"
              y="-6"
              width="12"
              height="10"
              rx="4"
              fill="#ffffff"
              stroke="var(--color-cosmic-bg)"
              strokeWidth="1.5"
            />
            <rect
              x="-3"
              y="2"
              width="6"
              height="5"
              fill="#ffffff"
              stroke="var(--color-cosmic-bg)"
              strokeWidth="1.5"
            />
            <circle cx="-2.5" cy="-2" r="1.5" fill="#000" />
            <circle cx="2.5" cy="-2" r="1.5" fill="#000" />
            <line
              x1="-10"
              y1="-8"
              x2="10"
              y2="6"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="10"
              y1="-8"
              x2="-10"
              y2="6"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </g>
      );
    case "reindeer_horns":
      return (
        <g
          id="accessory-reindeer-horns"
          className="pointer-events-none"
          transform="translate(0, 1)"
        >
          <path
            d="M 54,23 L 42,-5 M 46,12 L 32,8 M 44,4 L 30,-2"
            fill="none"
            stroke="#92400e"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M 146,23 L 158,-5 M 154,12 L 168,8 M 156,4 L 170,-2"
            fill="none"
            stroke="#92400e"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <g transform="translate(100, 18) scale(0.7)">
            <path
              d="M -8,-4 L 8,4 L 8,-4 L -8,4 Z"
              fill="#ef4444"
              stroke="var(--color-cosmic-border)"
              strokeWidth="2"
            />
            <circle
              cx="0"
              cy="0"
              r="3.5"
              fill="#facc15"
              stroke="var(--color-cosmic-border)"
              strokeWidth="1.5"
            />
          </g>
        </g>
      );
    case "slime_blob":
      return (
        <g
          id="accessory-slime-blob"
          className="pointer-events-none animate-bounce"
          style={{ animationDuration: "1.8s" }}
        >
          <path
            d="M 86,22 C 84,8 116,8 114,22 Z"
            fill="#22c55e"
            stroke="#155e75"
            strokeWidth="2.5"
            opacity="0.92"
          />
          <ellipse
            cx="94"
            cy="14"
            rx="3"
            ry="1.5"
            fill="#fff"
            opacity="0.65"
            transform="rotate(-20 94 14)"
          />
          <circle cx="96" cy="18" r="1.5" fill="#155e75" />
          <circle cx="104" cy="18" r="1.5" fill="#155e75" />
          <path
            d="M 98,20 Q 100,22 102,20"
            fill="none"
            stroke="#155e75"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </g>
      );
    case "top_hat":
      return (
        <g id="accessory-top-hat" className="pointer-events-none" transform="translate(0, -6)">
          <path
            d="M 78,21 L 82,1 L 118,1 L 122,21 Z"
            fill="#1e293b"
            stroke="var(--color-cosmic-bg)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <rect
            x="78"
            y="15"
            width="44"
            height="6"
            fill="#ef4444"
            stroke="var(--color-cosmic-bg)"
            strokeWidth="2"
          />
          <ellipse
            cx="100"
            cy="22"
            rx="42"
            ry="5.5"
            fill="#0f172a"
            stroke="var(--color-cosmic-bg)"
            strokeWidth="3"
          />
        </g>
      );
    case "devil_horns":
      return (
        <g id="accessory-devil-horns" className="pointer-events-none animate-pulse">
          <path
            d="M 52,24 C 44,20 40,5 28,10 C 34,22 45,28 50,28"
            fill="#f43f5e"
            stroke="#881337"
            strokeWidth="3"
            strokeLinejoin="round"
            filter="drop-shadow(0 0 3px rgba(244, 63, 94, 0.8))"
          />
          <path
            d="M 148,24 C 156,20 160,5 172,10 C 166,22 155,28 150,28"
            fill="#f43f5e"
            stroke="#881337"
            strokeWidth="3"
            strokeLinejoin="round"
            filter="drop-shadow(0 0 3px rgba(244, 63, 94, 0.8))"
          />
        </g>
      );
    case "butterfly_wings":
      return (
        <g id="accessory-butterfly-wings" className="pointer-events-none">
          <path
            d="M 50,75 C 10,40 -10,80 30,110 C 15,130 35,145 50,115"
            fill="#e879f9"
            stroke="var(--color-cosmic-border)"
            strokeWidth="2.5"
            opacity="0.9"
          />
          <path d="M 45,85 C 20,65 10,90 32,105" fill="#f472b6" opacity="0.8" />
          <path
            d="M 150,75 C 190,40 210,80 170,110 C 185,130 165,145 150,115"
            fill="#e879f9"
            stroke="var(--color-cosmic-border)"
            strokeWidth="2.5"
            opacity="0.9"
          />
          <path d="M 155,85 C 180,65 190,90 168,105" fill="#f472b6" opacity="0.8" />
          <path
            d="M 94,18 Q 90,0 86,-4 M 106,18 Q 110,0 114,-4"
            fill="none"
            stroke="var(--color-cosmic-border)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="86" cy="-4" r="2" fill="#d946ef" />
          <circle cx="114" cy="-4" r="2" fill="#d946ef" />
          <path d="M 85,22 Q 100,10 115,22" fill="none" stroke="#d946ef" strokeWidth="3" />
        </g>
      );
    default:
      return null;
  }
});
PlanetAccessory.displayName = "PlanetAccessory";
