/** Denard refined fashion brand tokens */
export const denardBrand = {
  colours: {
    softIvory: "#F6F1EA",
    white: "#FFFFFF",
    richCharcoal: "#1F1F1F",
    charcoalHover: "#333333",
    premiumMint: "#7FAF9B",
    mintHover: "#6A9B87",
    deepMint: "#356B5A",
    deepMintHover: "#285244",
    champagneGold: "#9A7A3A",
    warmTaupe: "#B7A89A",
    amberFire: "#F39C12",
    mintSoft: "#E7F1EC",
  },
  balance: {
    ivoryWhite: "~70%",
    charcoal: "~18%",
    mint: "~8%",
    gold: "~3%",
    amber: "~1%",
  },
  hierarchy: {
    background: "softIvory / white",
    text: "richCharcoal",
    primaryAction: "deepMint",
    softBrand: "premiumMint",
    premiumDetail: "champagneGold",
    supporting: "warmTaupe",
    urgency: "amberFire",
  },
  imageRatios: {
    product: "3 / 4",
    categorySquare: "1 / 1",
    banner: "16 / 9",
    heroDesktop: "21 / 9",
    heroMobile: "4 / 5",
  },
} as const;

export type DenardBrand = typeof denardBrand;
