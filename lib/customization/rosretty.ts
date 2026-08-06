import type { CustomizationGroup, CustomizationOption } from "@/types/customization";
import type { Product } from "@/types/product";

const assetRoot = "/images/rosretty-options";

function asset(path: string) {
  return encodeURI(`${assetRoot}/${path}`);
}

function imageOption(id: string, label: string, path: string, description?: string): CustomizationOption {
  return {
    id,
    label,
    description,
    swatch: { kind: "image", value: asset(path) }
  };
}

function productText(product: Product) {
  return [
    product.title,
    product.handle,
    product.vendor,
    product.extended.brand,
    product.extended.sourceTitle,
    ...product.tags
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function shownOption(product: Product): CustomizationOption {
  const image = product.featuredImage ?? product.images[0];
  return image
    ? {
        id: "as-shown",
        label: "As shown",
        description: "The finish shown in the product gallery.",
        priceDelta: 0,
    productionNote: "Default selection.",
        swatch: { kind: "image", value: image.url }
      }
    : { id: "as-shown", label: "As shown", priceDelta: 0, productionNote: "Default supplier selection." };
}

const eyeColors = Array.from({ length: 10 }, (_, index) => {
  const number = index + 1;
  return imageOption(`eye-${number}`, `Eye color ${String(number).padStart(2, "0")}`, `Eyes color/${number === 9 ? "9-1" : number}.jpg`);
});

const wigs = Array.from({ length: 15 }, (_, index) => imageOption(`wig-${index + 1}`, `Wig ${String(index + 1).padStart(2, "0")}`, `Wigs/wigs (${index + 1}).jpg`));

export function getRosrettyCustomizationGroups(product: Product): CustomizationGroup[] {
  const text = productText(product);
  // Rosretty's silicone-head listings use a TPE body, so use the matching
  // TPE skin-tone references even when the body material is omitted in a title.
  const isTpe = /\btpe\b|silicone head/.test(text);
  const isTorso = /\btorso\b|half body|upper body/.test(text);
  const isMale = /\bmale\b|\bman\b/.test(text);
  const groups: CustomizationGroup[] = [
    {
      id: "skin-tone",
      label: "Skin tone",
      description: "Choose a factory skin reference for this material.",
      required: true,
      display: "swatches",
      options: isTpe
        ? [
            shownOption(product),
            imageOption("skin-natural", "Natural", "Skin color---TPE/Skin-Color_Natural.jpg"),
            imageOption("skin-light-tan", "Light tan", "Skin color---TPE/Skin-Color_Light-Tan.jpg"),
            imageOption("skin-tan", "Tan", "Skin color---TPE/Skin-Color_Tan.jpg"),
            imageOption("skin-bronze", "Bronze", "Skin color---TPE/Skin-Color_Bronze.jpg"),
            imageOption("skin-black", "Black", "Skin color---TPE/Skin-Color_Black.jpg")
          ]
        : [
            shownOption(product),
            imageOption("skin-natural", "Natural", "Skin color---Full silicone/Natural.jpg"),
            imageOption("skin-light-tan", "Light tan", "Skin color---Full silicone/Light Tan.jpg"),
            imageOption("skin-tan", "Tan", "Skin color---Full silicone/Tan.jpg"),
            imageOption("skin-coco", "Coco", "Skin color---Full silicone/Coco.jpg")
          ]
    },
    {
      id: "eye-color",
      label: "Eye color",
      description: "Choose an eye reference for the selected head.",
      required: true,
      display: "swatches",
      options: [shownOption(product), ...eyeColors]
    },
    {
      id: "wig-style",
      label: "Wig style",
      description: "Choose the supplied wig style.",
      required: true,
      display: "swatches",
      options: [shownOption(product), ...wigs]
    },
    {
      id: "mouth-type",
      label: "Mouth type",
      description: "Available with compatible heads.",
      display: "cards",
      options: [
        shownOption(product),
        imageOption("mouth-standard", "Standard mouth", "Mouth Type/head-without-tongue.jpg"),
        imageOption("mouth-tongue", "Tongue", "Mouth Type/head-with-tongue.jpg")
      ]
    },
    {
      id: "nail-color",
      label: "Finger and toenail color",
      display: "swatches",
      options: [
        shownOption(product),
        imageOption("nail-106", "Nail color 106", "Finger-Toenail Color/Nail_106.jpg"),
        imageOption("nail-110", "Nail color 110", "Finger-Toenail Color/Nail_110-1.jpg"),
        imageOption("nail-114", "Nail color 114", "Finger-Toenail Color/Nail_114-1.jpg"),
        imageOption("nail-118", "Nail color 118", "Finger-Toenail Color/Nail_118-1.jpg"),
        imageOption("nail-142", "Nail color 142", "Finger-Toenail Color/Nail_142-1.jpg")
      ]
    },
    {
      id: "skeleton",
      label: "Skeleton",
      description: "Choose the available internal frame option.",
      display: "cards",
      options: [shownOption(product), imageOption("skeleton-standard", "Standard skeleton", "Skeleton/Standrad.jpg"), imageOption("skeleton-evo", "EVO skeleton", "Skeleton/Evo.jpg")]
    },
    {
      id: "standing-feet",
      label: "Standing feet",
      display: "cards",
      options: [shownOption(product), imageOption("non-standing", "Non-standing feet", "Standing- Non Standing/Non standing.jpg"), imageOption("standing", "Standing feet", "Standing- Non Standing/Standing.jpg")]
    }
  ];

  if (!isTorso && !isMale) {
    groups.push(
      {
        id: "breast-feel",
        label: "Breast option",
        display: "cards",
        options: [shownOption(product), imageOption("breast-solid", "Solid", "Breast option/Solid-TPE.jpg"), imageOption("breast-hollow", "Hollow", "Breast option/Hollow.jpg"), imageOption("breast-gel", "Gel-filled", "Breast option/Gel-Filled.jpg")]
      },
      {
        id: "areola-color",
        label: "Areola color",
        display: "swatches",
        options: [shownOption(product), imageOption("areola-natural", "Natural", "Areola Color/Natural.jpg"), imageOption("areola-pink", "Pink", "Areola Color/Pink.jpg"), imageOption("areola-light-brown", "Light brown", "Areola Color/Light brown.jpg"), imageOption("areola-dark-brown", "Dark brown", "Areola Color/Dark brown.jpg")]
      },
      {
        id: "areola-size",
        label: "Areola size",
        display: "swatches",
        options: [shownOption(product), imageOption("areola-3", "3 cm", "Areola Color/Areola-Size-3cm.png"), imageOption("areola-4", "4 cm", "Areola Color/Areola-Size-4cm.png"), imageOption("areola-5", "5 cm", "Areola Color/Areola-Size-5cm.png")]
      },
      {
        id: "vagina-type",
        label: "Vagina type",
        display: "cards",
        options: [shownOption(product), imageOption("vagina-fixed", "Fixed", "Fixed_Insertable Vagina/vagina-type-Fixed.jpg"), imageOption("vagina-insertable", "Insertable", "Fixed_Insertable Vagina/vagina-type-Insertable.jpg")]
      },
      {
        id: "vagina-color",
        label: "Vagina color",
        display: "swatches",
        options: [shownOption(product), imageOption("vagina-natural", "Natural", "Vagina color/Natural.jpg"), imageOption("vagina-pink", "Pink", "Vagina color/Pink.jpg"), imageOption("vagina-light-brown", "Light brown", "Vagina color/Light brown.jpg"), imageOption("vagina-dark-brown", "Dark brown", "Vagina color/Dark brown.jpg")]
      }
    );
  }

  if (!isTorso) {
    groups.push({
      id: "body-features",
      label: "Additional features",
      description: "Select compatible features to confirm with our team.",
      selectionMode: "multiple",
      display: "cards",
      options: [
        { ...shownOption(product), id: "no-additional-features", label: "No additional features" },
        imageOption("feature-articulated-fingers", "Articulated fingers", "Other option/Articulated-Fingers.jpg"),
        imageOption("feature-auto-blowjob", "Auto blowjob", "Other option/Auto Blowjob.jpg"),
        imageOption("feature-breath", "Breathing", "Other option/Breath.jpg"),
        imageOption("feature-detachable-legs", "Detachable legs", "Other option/Detachable Legs.jpg"),
        imageOption("feature-electric-hip", "Electric hip and waist", "Other option/Electric Hip and Waist.jpg"),
        imageOption("feature-heating", "Heating", "Other option/Heating.jpg"),
        imageOption("feature-body-painting", "Realistic body painting", "Other option/Realistic-Body-Painting.jpg"),
        imageOption("feature-enhanced-painting", "Enhanced body painting", "Other option/Hyper Realism Body Painting.jpg"),
        imageOption("feature-moaning", "Moaning", "Other option/Moaning.jpg"),
        imageOption("feature-oral-suction", "Oral suction", "Other option/Oral sucking（only Movable jaw head can do ）.jpg"),
        imageOption("feature-sucking-vagina", "Sucking vagina", "Other option/Sucking Vagina.jpg")
      ]
    });
  }

  groups.push({
    id: "accessories",
    label: "Storage and accessories",
    selectionMode: "multiple",
    display: "cards",
    options: [
      { ...shownOption(product), id: "no-accessories", label: "No additional accessories" },
      imageOption("accessory-hanging-hook", "Hanging hook", "Accessories/Hanging-Hook-1 (2).jpg"),
      imageOption("accessory-headstand", "Head stand", "Accessories/headstand_200.jpg"),
      imageOption("accessory-flight-case", "Flight case", "Accessories/sexdoll-flight-cases-200.jpg")
    ]
  });

  return groups;
}
