import type { Product } from "@/types/product";
import type { CustomizationGroup, CustomizationOption } from "@/types/customization";

const rosemaryAsset = (path: string) => `https://www.rosemarydoll.com/wp-content/uploads/${path}`;

function imageOption(id: string, label: string, path: string, priceDelta = 0, description?: string): CustomizationOption {
  return {
    id,
    label,
    description,
    priceDelta,
    swatch: { kind: "image", value: rosemaryAsset(path), label }
  };
}

const recentHeadOptions: CustomizationOption[] = [
  imageOption("jane-bennet-ros-2", "Jane Bennet ROS-2", "2021/03/Jane-Bennet-ROS-2.jpeg"),
  imageOption("jin-5", "Jin-5", "2021/03/Jin-5.jpeg"),
  imageOption("seraphina-ros", "Seraphina ROS", "2021/03/Seraphina-ROS.jpeg"),
  imageOption("snow", "Snow", "2021/03/Snow.jpeg"),
  imageOption("asuka-eva-2", "Asuka Eva-2", "2021/03/Asuka-Eva-2.jpeg"),
  imageOption("xue-4", "Xue-4", "2021/03/Xue-4.jpeg"),
  imageOption("xue-5", "Xue-5", "2021/03/Xue-5.jpeg"),
  imageOption("yuan-2", "Yuan-2", "2021/03/Yuan-2.jpeg"),
  imageOption("ashley-ros", "Ashley ROS", "2021/03/Ashley-ROS.jpeg"),
  imageOption("jane-bennet-ros", "Jane Bennet ROS", "2021/03/Jane-Bennet.jpg"),
  imageOption("qingwen-ros-4", "Qingwen ROS-4", "2021/03/Qingwen-ROS-4.jpg"),
  imageOption("kelly-3", "Kelly-3", "2021/03/Kelly-3.jpg"),
  imageOption("ivory-2", "Ivory-2", "2021/03/Ivory-2.jpg"),
  imageOption("keqing-qin", "Keqing Qin", "2021/03/Keqing-Qin.jpg"),
  imageOption("nina-3", "Nina-3", "2021/03/Nina-3.jpg"),
  imageOption("jia-lin", "Jia Lin", "2021/03/Jia-Lin.jpg"),
  imageOption("misa-2", "Misa-2", "2021/03/Misa-2.jpg"),
  imageOption("iris-4", "Iris-4", "2021/03/Iris-4.jpg"),
  imageOption("amber-ros", "Amber ROS", "2021/03/Amber-ROS.jpg"),
  imageOption("adele-3", "Adele-3", "2021/03/Adele-3.jpg"),
  imageOption("takiyah-2", "Takiyah-2", "2021/03/Takiyah-2.jpg"),
  imageOption("natalia-4", "Natalia-4", "2021/03/Natalia-4.jpg"),
  imageOption("mio-2", "Mio-2", "2021/03/Mio-2.jpg"),
  imageOption("miaoyu", "Miaoyu", "2021/03/Miaoyu.jpg"),
  imageOption("elysia-ros", "Elysia ROS", "2021/03/Elysia-ROS.jpg"),
  imageOption("bao-chai-ros", "Baochai ROS", "2021/03/Baochai-ROS.jpg")
];

const headModel: CustomizationGroup = {
  id: "head-model",
  label: "Head model",
  description: "Keep the photographed head or switch to another current Starpery head at no extra charge.",
  required: true,
  display: "swatches",
  options: [
    imageOption("shown-head", "Keep the head shown", "2020/04/default-300x300.jpg"),
    ...recentHeadOptions,
    imageOption("other-head", "Another Starpery head", "2021/11/other-1.jpg", 0, "Enter the exact Starpery head name in the order note after adding to cart.")
  ]
};

const headConstruction: CustomizationGroup = {
  id: "head-construction",
  label: "Head type",
  description: "Factory head construction. ROS adds a movable jaw, soft tongue, and soft teeth.",
  required: true,
  display: "swatches",
  options: [
    imageOption("hard-silicone", "Hard silicone", "2023/12/Hard-Silicone.jpg", 0, "More structured facial detail; implanted brows and lashes are standard."),
    imageOption("soft-silicone", "Soft silicone", "2023/12/Soft-Silicone-50.jpg", 0, "Softer head with a simple oral cavity."),
    imageOption("ros", "ROS movable-jaw head", "2021/03/Starpery-ROS-Head.jpg", 100, "Realistic Oral Structure with movable jaw, soft tongue, and soft teeth.")
  ]
};

const skinTone: CustomizationGroup = {
  id: "skin-tone",
  label: "Skin tone",
  description: "Starpery skin-tone choices are included. Slight batch and material variation is normal.",
  required: true,
  display: "swatches",
  options: [
    imageOption("light-tan", "Light tan", "2021/03/Light-tan.jpg"),
    imageOption("tan", "Tan", "2021/03/Tan-2.jpg"),
    imageOption("wheat", "Wheat", "2021/03/Wheat.jpg"),
    imageOption("cocoa", "Cocoa", "2021/03/Cocoa-Skin.jpg"),
    imageOption("porcelain", "Porcelain", "2021/03/Porcelain-Skin.jpg")
  ]
};

const eyeColor: CustomizationGroup = {
  id: "eye-color",
  label: "Eye color",
  description: "Brown, blue, and green movable eyes are included—there is no color surcharge.",
  required: true,
  display: "swatches",
  options: [
    imageOption("brown", "Brown", "2021/04/3-1.jpg"),
    imageOption("blue", "Blue", "2021/04/4-1.jpg"),
    imageOption("green", "Green", "2021/04/2-1.jpg")
  ]
};

const eyeType: CustomizationGroup = {
  id: "eye-type",
  label: "Eye detail",
  description: "Both Starpery full-ball movable eye styles are included.",
  required: true,
  display: "swatches",
  options: [
    imageOption("standard", "Movable eyes", "2021/04/moveable-full-ball-eyes.jpg"),
    imageOption("blood-vessels", "Movable eyes with blood vessels", "2021/04/moveable-full-ball-bloody-eyes.jpg")
  ]
};

const hairFinish: CustomizationGroup = {
  id: "hair-finish",
  label: "Hair finish",
  description: "A wig is standard. Starpery recommends a hard head when choosing implanted hair.",
  required: true,
  display: "swatches",
  options: [
    imageOption("wig", "Supplier wig", "2020/04/default-300x300.jpg"),
    imageOption("synthetic", "Implanted synthetic hair", "2021/04/Implanted-Hair.jpg", 150),
    imageOption("human", "Implanted human hair", "2021/04/Implanted-Hair.jpg", 300)
  ]
};

const hairstyle: CustomizationGroup = {
  id: "hairstyle",
  label: "Wig style",
  description: "Choose the included removable wig supplied with the doll.",
  required: true,
  display: "swatches",
  options: [
    imageOption("shown-style", "Keep the style shown", "2020/04/default-300x300.jpg"),
    imageOption("style-1", "Black long", "2021/03/Black-Long.png"),
    imageOption("style-2", "Black medium", "2021/03/Black-Medium.png"),
    imageOption("style-3", "Blonde with bangs", "2021/03/Blonde-Hair-with-bang.png"),
    imageOption("style-4", "Blonde long", "2021/03/Blonde-Long.png"),
    imageOption("style-5", "Blonde short", "2021/03/Blonde-Short.png"),
    imageOption("style-6", "Brown long", "2021/03/Brown-Long.png"),
    imageOption("style-7", "Brown short", "2021/03/Brown-Short.png"),
    imageOption("style-8", "Gradient style 1", "2021/03/Gradient-hair-1.png"),
    imageOption("style-9", "Gradient style 2", "2021/03/Gradient-hair-2.png"),
    imageOption("style-10", "Green long and curly", "2021/03/Green-Long-Curly.png"),
    imageOption("style-11", "Red long and curly", "2021/03/Red-Long-Curly.png"),
    imageOption("style-12", "Red medium", "2021/03/Red-Medium.png")
  ]
};

const breastType: CustomizationGroup = {
  id: "breast-type",
  label: "Breast fill",
  description: "Both factory breast constructions are included for supported bodies.",
  required: true,
  display: "cards",
  options: [
    { id: "gel", label: "Gel breasts", priceDelta: 0, description: "Softer, gel-filled construction." },
    { id: "solid", label: "Solid breasts", priceDelta: 0, description: "Standard solid construction." }
  ]
};

const vaginaType: CustomizationGroup = {
  id: "vagina-type",
  label: "Vagina type",
  description: "Choose a fixed or removable construction where supported by this body.",
  required: true,
  display: "cards",
  options: [
    { id: "fixed", label: "Fixed", priceDelta: 0 },
    { id: "removable", label: "Removable insert", priceDelta: 0 }
  ]
};

const vaginaTexture: CustomizationGroup = {
  id: "vagina-texture",
  label: "Internal texture",
  description: "Factory texture choices are included.",
  required: true,
  display: "compact",
  options: [
    { id: "a", label: "Texture A", priceDelta: 0 },
    { id: "b", label: "Texture B", priceDelta: 0 },
    { id: "c", label: "Texture C", priceDelta: 0 }
  ]
};

const pubicHair: CustomizationGroup = {
  id: "pubic-hair",
  label: "Pubic hair",
  description: "Factory standard implanted hair is included; custom work and adhesive appliqués are optional.",
  required: true,
  display: "cards",
  options: [
    { id: "none", label: "None", priceDelta: 0 },
    { id: "standard", label: "Standard implanted style", priceDelta: 0 },
    { id: "custom", label: "Custom implanted shape", priceDelta: 100, description: "Upload or send the desired shape after ordering." },
    { id: "paster", label: "Adhesive hair appliqué", priceDelta: 80 }
  ]
};

const nailColor = (id: string, label: string): CustomizationGroup => ({
  id,
  label,
  description: "Factory nail colors are included.",
  required: true,
  display: "swatches",
  options: [
    imageOption("natural", "Natural", "2021/03/Natural-finger-nail-1.jpg"),
    imageOption("french", "French", "2021/03/French-finger-nail-1.jpg"),
    imageOption("black", "Black", "2021/03/Black-finger-nail-1.jpg"),
    imageOption("dark-green", "Dark green", "2021/03/Dark-Green-finger-nail-1.jpg"),
    imageOption("orange", "Orange", "2021/03/Orange-finger-nail-1.jpg"),
    imageOption("red", "Red", "2021/03/Red-finger-nail-1.jpg")
  ]
});

const bodyConstruction = (silicone: boolean, supportsGelBelly: boolean): CustomizationGroup => ({
  id: "body-construction",
  label: "Body construction",
  description: "Included softness and construction choices are filtered for this body.",
  selectionMode: "multiple",
  display: "cards",
  options: [
    { id: "gel-breasts", label: "Gel breasts", priceDelta: 0 },
    ...(silicone ? [{ id: "gel-butt", label: "Gel butt", priceDelta: 0 }] : []),
    ...(supportsGelBelly ? [{ id: "gel-belly", label: "Gel belly", priceDelta: 100 }] : []),
    { id: "standing-feet", label: "Standing feet with bolts", priceDelta: 0 },
    ...(silicone ? [{ id: "hard-feet", label: "Hard feet without bolts", priceDelta: 100 }] : []),
    { id: "articulated-fingers", label: "Starpery 2.0 articulated fingers", priceDelta: 165 }
  ]
});

const premiumOptions = (silicone: boolean): CustomizationGroup => ({
  id: "premium-options",
  label: "Premium functions",
  description: "Factory-supported upgrades with their current recommended website prices.",
  selectionMode: "multiple",
  display: "cards",
  options: [
    { id: "body-moaning", label: "Five-point moaning system", priceDelta: 100, productionNote: "Electronic systems are not covered by factory after-sales support once shipped." },
    { id: "heating", label: "Heating system 3.0", priceDelta: 200, productionNote: "Electronic systems are not covered by factory after-sales support once shipped." },
    ...(silicone ? [{ id: "clamping-suction", label: "Clamping and suction", priceDelta: 150, productionNote: "Requires a fixed vagina." }] : []),
    { id: "custom-face", label: "Custom face realism", priceDelta: 200 },
    { id: "custom-body", label: "Custom body realism", priceDelta: 250 },
    { id: "no-weight-reduction", label: "Full-weight body", priceDelta: 150, productionNote: "May increase shipping cost; Starpery weight reduction is otherwise standard." }
  ]
});

const additionalHead: CustomizationGroup = {
  id: "additional-head",
  label: "Additional head",
  description: "A second Starpery head ordered with the doll is $500. Choose its model here.",
  required: true,
  display: "swatches",
  options: [
    { id: "none", label: "No additional head", priceDelta: 0 },
    ...recentHeadOptions.map((option) => ({ ...option, id: `extra-${option.id}`, priceDelta: 500 })),
    imageOption("extra-other-head", "Another Starpery head", "2021/11/other-1.jpg", 500, "Enter the exact Starpery head name in the order note after adding to cart.")
  ]
};

const accessories: CustomizationGroup = {
  id: "accessories",
  label: "Accessories",
  description: "Optional factory accessories.",
  selectionMode: "multiple",
  display: "compact",
  options: [
    { id: "removable-insert", label: "Spare removable vagina insert", priceDelta: 15 },
    { id: "penis-adapter", label: "Penis adapter", priceDelta: 25 },
    { id: "extra-eyes", label: "Extra eyes", priceDelta: 10 },
    { id: "extra-wig", label: "Extra wig", priceDelta: 10 },
    { id: "flight-case", label: "Flight case", priceDelta: 125, productionNote: "Additional shipping may apply." }
  ]
};

export function getStarperyCustomizationGroups(product: Product): CustomizationGroup[] {
  const material = `${product.extended.material ?? ""} ${product.productType} ${product.title}`.toLowerCase();
  const silicone = material.includes("silicone");
  const body = `${product.extended.heightCm ?? ""}${product.extended.cupSize ?? ""} ${product.title}`.replace(/\s+/g, "").toLowerCase();
  const supportsGelBelly = silicone && (body.includes("161cmh") || body.includes("168cmh") || body.includes("161h") || body.includes("168h"));

  return [
    headModel,
    headConstruction,
    skinTone,
    eyeColor,
    eyeType,
    hairstyle,
    hairFinish,
    nailColor("nail-color", "Fingernail color"),
    nailColor("toe-nail-color", "Toenail color"),
    breastType,
    vaginaType,
    vaginaTexture,
    pubicHair,
    bodyConstruction(silicone, supportsGelBelly),
    premiumOptions(silicone),
    additionalHead,
    accessories
  ];
}
