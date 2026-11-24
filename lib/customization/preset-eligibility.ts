// Generated from accepted local review manifests. Do not load rollout artifacts at runtime.
export type ReviewedPresetRecipe = "yl-tpe" | "wm-heating" | "wm-evo-safe" | "bespoke";
export type ReviewedPresetTier = { id: "starter" | "popular" | "premium"; add: string[] };
export type ReviewedBespokePreset = { groupId: string; managedOptionIds: string[]; tiers: ReviewedPresetTier[]; applyWmGuard: boolean };
export type ReviewedPresetEligibility = { recipe: ReviewedPresetRecipe; configId: string; bespoke?: ReviewedBespokePreset };
export const reviewedPresetEligibility: Readonly<Record<string, ReviewedPresetEligibility>> = {
  "wm-aaireca-163cm-d-cup-silicone-head-companion-doll-1td0f": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-abbie-171cm-h-cup-tpe-companion-doll-493ex": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-abigail-156cm-b-cup-tpe-companion-doll-1vgtq": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-ada-150cm-m-cup-tpe-companion-doll-n2m01": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-addison-163cm-h-cup-tpe-companion-doll-1tbg6": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-adrianna-172cm-b-cup-tpe-companion-doll-rd91h": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-afra-carl-160cm-d-cup-tpe-companion-doll-1tpst": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-afra-toland-162cm-f-cup-tpe-companion-doll-1tfj2": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-aisha-155cm-l-cup-tpe-companion-doll-vgno6": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-aisu-157cm-b-cup-tpe-companion-doll-1dmex": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-alana-167cm-f-cup-tpe-companion-doll-1kfv0": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-alicia-156cm-h-cup-tpe-companion-doll-1sakz": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-alisha-166cm-c-cup-tpe-companion-doll-18342": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-allie-170cm-m-cup-tpe-companion-doll-ytwue": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-ally-155cm-l-cup-tpe-companion-doll-8fsiy": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-alma-156cm-b-cup-tpe-companion-doll-1q2mq": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-alyssa-160cm-d-cup-tpe-companion-doll-i8k0n": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-amanda-170cm-m-cup-tpe-companion-doll-eay8m": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-amani-170cm-h-cup-tpe-companion-doll-14de7": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-amara-162cm-e-cup-tpe-companion-doll-o00tr": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-amaris-163cm-c-cup-tpe-companion-doll-1ccgh": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-amber-163cm-h-cup-tpe-companion-doll-1jlck": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-amelia-160cm-d-cup-tpe-companion-doll-i8qw2": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-amethyst-162cm-f-cup-tpe-companion-doll-nqbey": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-amethyst-174cm-g-cup-tpe-companion-doll-ddvrf": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-amethyst-175cm-d-cup-tpe-companion-doll-9e4v1": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-amina-155cm-l-cup-tpe-companion-doll-vgq0u": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-amirah-155cm-l-cup-tpe-companion-doll-1fzy3": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-anae-156cm-h-cup-tpe-companion-doll-17j0e": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-anastasia-164cm-f-cup-tpe-companion-doll-699uo": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-anastasia-174cm-g-cup-tpe-companion-doll-tly92": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-anna-160cm-d-cup-tpe-companion-doll-1jtnj": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-anne-171cm-h-cup-tpe-companion-doll-2fflc": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-anris-165cm-f-cup-silicone-head-companion-doll-1jnh0": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-anris-165cm-f-cup-silicone-head-companion-doll-1ucrr": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-apphia-159cm-b-cup-tpe-companion-doll-1x1gc": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-armani-162cm-e-cup-tpe-companion-doll-xsjdf": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-aryana-157cm-b-cup-tpe-companion-doll-j933w": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-ashley-156cm-h-cup-tpe-companion-doll-1sef2": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-aubrey-150cm-m-cup-tpe-companion-doll-170r9": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-audrey-166cm-c-cup-tpe-companion-doll-187yz": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-auetta-154cm-b-cup-silicone-head-companion-doll-mwq8u": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-auetta-166cm-c-cup-silicone-head-companion-doll-jpwf5": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-authentic-japanese-warrior-anime-sex-companion-doll-1nwla": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-ava-156cm-b-cup-tpe-companion-doll-1e4bm": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-avery-163cm-h-cup-tpe-companion-doll-1jlid": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-bahia-165cm-d-cup-tpe-companion-doll-1ncmx": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-barbara-162cm-e-cup-tpe-companion-doll-1nuhu": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-belinda-173cm-h-cup-tpe-companion-doll-103m1": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-betsy-kelsen-164cm-d-cup-tpe-companion-doll-ykypu": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-bettina-163cm-c-cup-tpe-companion-doll-i9cum": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-betty-lizzie-159cm-g-cup-tpe-companion-doll-1yr9w": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-beulah-170cm-d-cup-tpe-companion-doll-13py9": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-bid-166cm-c-cup-tpe-companion-doll-1drot": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-bimbo-158cm-l-cup-tpe-companion-doll-13s0x": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-blake-159cm-c-cup-tpe-companion-doll-13kkk": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-blechschmidt-165cm-d-cup-tpe-companion-doll-1n30y": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-bradney-165cm-d-cup-tpe-companion-doll-6giqf": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-breenda-156cm-m-cup-tpe-companion-doll-o9r79": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-brenda-170cm-m-cup-tpe-companion-doll-eutdx": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-brianna-160cm-d-cup-tpe-companion-doll-edvuf": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-bryan-164cm-d-cup-tpe-companion-doll-ofxun": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-buzzi-163cm-c-cup-tpe-companion-doll-1p5iw": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-byron-166cm-c-cup-tpe-companion-doll-ocuvl": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-cailyn-171cm-h-cup-tpe-companion-doll-1pqhs": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-caires-166cm-c-cup-silicone-head-companion-doll-kd2a6": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-camille-adolph-154cm-b-cup-tpe-companion-doll-10u4s": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-camille-mary-164cm-d-cup-silicone-head-companion-doll-1ee5b": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-campbell-155cm-l-cup-tpe-companion-doll-1pb57": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-cara-lizzie-162cm-f-cup-tpe-companion-doll-idetd": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-carlota-163cm-h-cup-tpe-companion-doll-gxvos": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-carlota-163cm-h-cup-tpe-companion-doll-xkody": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-carly-mall-163cm-h-cup-tpe-companion-doll-vm5kn": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-caro-171cm-h-cup-tpe-companion-doll-2fglr": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-carol-156cm-b-cup-tpe-companion-doll-6gg8f": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-caroline-170cm-m-cup-tpe-companion-doll-1x0fr": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-carolyn-163cm-h-cup-tpe-companion-doll-xkq8t": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-cathy-dolly-164cm-d-cup-tpe-companion-doll-19b73": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-cecelia-167cm-f-cup-tpe-companion-doll-1wwc1": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-cecily-166cm-c-cup-tpe-companion-doll-18x8p": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-charlee-168cm-i-cup-silicone-head-companion-doll-1vhth": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-charlie-171cm-h-cup-tpe-companion-doll-1y7f0": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-charlotte-160cm-d-cup-tpe-companion-doll-17b2r": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-cherish-172cm-b-cup-tpe-companion-doll-khc22": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-chloe-156cm-b-cup-tpe-companion-doll-6gkkv": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-chloe-pansy-159cm-c-cup-tpe-companion-doll-r3bcx": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-chloe-reed-165cm-g-cup-tpe-companion-doll-ggx2p": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-christophe-164cm-f-cup-silicone-companion-doll-1hyqg": {
    "recipe": "bespoke",
    "configId": "wm-female-full-silicone",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "vine-talk-ai-box",
        "head-moaning"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "vine-talk-ai-box"
          ]
        },
        {
          "id": "premium",
          "add": [
            "vine-talk-ai-box",
            "head-moaning"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-clarence-elsie-158cm-d-cup-tpe-companion-doll-2ek4l": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-claris-170cm-h-cup-tpe-companion-doll-18xuo": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-cocoa-judith-172cm-b-cup-tpe-companion-doll-gi0mv": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-colodny-174cm-g-cup-tpe-companion-doll-ciaak": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-cora-kitto-169cm-l-cup-tpe-companion-doll-1w3h3": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-corolf-175cm-b-cup-tpe-companion-doll-ckc51": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-crable-163cm-c-cup-tpe-companion-doll-1qv8q": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-cristal-167cm-f-cup-tpe-companion-doll-44cxu": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-crystal-156cm-h-cup-tpe-companion-doll-10p24": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-dahlia-173cm-h-cup-tpe-companion-doll-15015": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-daisy-bell-162cm-f-cup-tpe-companion-doll-yv0qw": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-dale-159cm-c-cup-tpe-companion-doll-1kaa1": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-daphne-170cm-d-cup-tpe-companion-doll-14lr2": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-darcy-pope-158cm-d-cup-tpe-companion-doll-1o4ev": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-darcys-170cm-m-cup-tpe-companion-doll-fjs7t": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-deborah-170cm-d-cup-tpe-companion-doll-1gvzx": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-doggie-166cm-c-cup-tpe-companion-doll-19jus": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-dominica-175cm-d-cup-tpe-companion-doll-1lt3i": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-dominique-175cm-d-cup-tpe-companion-doll-ga8a2": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-doris-166cm-c-cup-tpe-companion-doll-ods2s": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-douce-165cm-d-cup-silicone-head-companion-doll-oar4j": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-dunbar-159cm-b-cup-tpe-companion-doll-1yjar": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-edyth-163cm-c-cup-tpe-companion-doll-1p6ve": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-effie-175cm-d-cup-tpe-companion-doll-7dopl": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-eileen-155cm-l-cup-tpe-companion-doll-1htz2": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-eileen-lew-175cm-d-cup-tpe-companion-doll-kwtka": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-elaine-172cm-b-cup-tpe-companion-doll-hpesn": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-elizabeth-156cm-m-cup-tpe-companion-doll-197st": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-ella-157cm-b-cup-tpe-companion-doll-1tic1": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-ella-finn-164cm-e-cup-tpe-companion-doll-1k4ya": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-ella-hicks-164cm-d-cup-tpe-companion-doll-o399p": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-ellemo-174cm-g-cup-tpe-companion-doll-lxciw": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-ellie-156cm-b-cup-tpe-companion-doll-6hqpv": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-elma-170cm-h-cup-tpe-companion-doll-rxu6f": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-elma-christian-172cm-b-cup-tpe-companion-doll-18hg8": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-elsa-162cm-e-cup-tpe-companion-doll-1alox": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-elsie-172cm-b-cup-tpe-companion-doll-1aebl": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-elva-hill-164cm-f-cup-tpe-companion-doll-1kn2e": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-elviria-169cm-l-cup-tpe-companion-doll-fqhzw": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-elvis-bertha-156cm-h-cup-tpe-companion-doll-1i50y": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-elvis-bertha-158cm-d-cup-tpe-companion-doll-175v7": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-ema-162cm-f-cup-tpe-companion-doll-1wm5v": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-emanuele-164cm-d-cup-tpe-companion-doll-1359d": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-emerald-160cm-a-cup-tpe-companion-doll-1igje": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-emily-150cm-m-cup-tpe-companion-doll-b4ivy": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-emily-christian-154cm-b-cup-tpe-companion-doll-1jtd8": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-emily-crichton-172cm-d-cup-tpe-companion-doll-2ebwc": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-emine-162cm-e-cup-tpe-companion-doll-o285z": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-emma-150cm-m-cup-tpe-companion-doll-4xw87": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-emma-dutt-164cm-d-cup-tpe-companion-doll-wthuk": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-emma-dutt-172cm-b-cup-tpe-companion-doll-1lwhv": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-emmalee-172cm-d-cup-tpe-companion-doll-1hce0": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-emna-170cm-d-cup-tpe-companion-doll-ocz6v": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-erin-166cm-c-cup-tpe-companion-doll-1f725": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-esterly-163cm-c-cup-tpe-companion-doll-1wwx0": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-eunice-170cm-h-cup-tpe-companion-doll-1a147": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-eunika-156cm-c-cup-tpe-companion-doll-p01sf": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-eva-167cm-f-cup-tpe-companion-doll-odjr3": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-fabian-marlowe-174cm-g-cup-tpe-companion-doll-4e2si": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-fanny-158cm-l-cup-tpe-companion-doll-3loiy": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-faraday-175cm-d-cup-tpe-companion-doll-1r0ro": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-flora-166cm-c-cup-tpe-companion-doll-oetoz": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-frantiska-153cm-n-cup-tpe-companion-doll-kq0mz": {
    "recipe": "bespoke",
    "configId": "wm-female-standard-tpe",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": false
    }
  },
  "wm-freddie-160cm-b-cup-tpe-companion-doll-z9qbh": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-gagne-168cm-e-cup-tpe-companion-doll-liraf": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-garcia-175cm-d-cup-tpe-companion-doll-gkhpb": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-garden-156cm-h-cup-tpe-companion-doll-1uyyq": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-geraldine-170cm-m-cup-tpe-companion-doll-1eary": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-gia-166cm-c-cup-tpe-companion-doll-1drow": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-gillnson-175cm-b-cup-tpe-companion-doll-nz5ro": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-grace-156cm-b-cup-tpe-companion-doll-6ixwo": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-gramann-163cm-c-cup-tpe-companion-doll-qh8ks": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-griffith-fast-168cm-d-cup-tpe-companion-doll-1xvbp": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-gwynevere-163cm-c-cup-tpe-companion-doll-gsvo4": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-hailey-163cm-h-cup-tpe-companion-doll-lrydt": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-haleigh-150cm-m-cup-tpe-companion-doll-6gd11": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-hannah-156cm-b-cup-tpe-companion-doll-1ogwo": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-hannigan-162cm-e-cup-tpe-companion-doll-11mio": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-hathorne-165cm-d-cup-tpe-companion-doll-1po3m": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-head-135-165cm-d-cup-silicone-companion-doll-62tt8": {
    "recipe": "wm-evo-safe",
    "configId": "wm-female-full-silicone"
  },
  "wm-head-172-160cm-i-cup-tpe-companion-doll-104ur": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-head-198-163cm-h-cup-silicone-companion-doll-1gykh": {
    "recipe": "wm-evo-safe",
    "configId": "wm-female-full-silicone"
  },
  "wm-head-198-163cm-h-cup-silicone-companion-doll-1gykh-2": {
    "recipe": "wm-evo-safe",
    "configId": "wm-female-full-silicone"
  },
  "wm-head-198-163cm-h-cup-silicone-companion-doll-h1zkg": {
    "recipe": "wm-evo-safe",
    "configId": "wm-female-full-silicone"
  },
  "wm-head-200-170cm-d-cup-silicone-companion-doll-1t3ox": {
    "recipe": "wm-evo-safe",
    "configId": "wm-female-full-silicone"
  },
  "wm-head-201-163cm-d-cup-silicone-companion-doll-1svo7": {
    "recipe": "wm-evo-safe",
    "configId": "wm-female-full-silicone"
  },
  "wm-head-201-170cm-d-cup-silicone-companion-doll-1kd7c": {
    "recipe": "wm-evo-safe",
    "configId": "wm-female-full-silicone"
  },
  "wm-head-201-170cm-d-cup-silicone-companion-doll-1t3ox": {
    "recipe": "wm-evo-safe",
    "configId": "wm-female-full-silicone"
  },
  "wm-head-202-163cm-d-cup-silicone-companion-doll-1svo7": {
    "recipe": "wm-evo-safe",
    "configId": "wm-female-full-silicone"
  },
  "wm-head-202-170cm-d-cup-silicone-companion-doll-1kd7d": {
    "recipe": "wm-evo-safe",
    "configId": "wm-female-full-silicone"
  },
  "wm-head-202-170cm-d-cup-silicone-companion-doll-1t3ox": {
    "recipe": "wm-evo-safe",
    "configId": "wm-female-full-silicone"
  },
  "wm-head-206-170cm-d-cup-silicone-companion-doll-1t3ox": {
    "recipe": "wm-evo-safe",
    "configId": "wm-female-full-silicone"
  },
  "wm-head-216-165cm-d-cup-silicone-companion-doll-62ttx": {
    "recipe": "wm-evo-safe",
    "configId": "wm-female-full-silicone"
  },
  "wm-head-266-165cm-d-cup-silicone-companion-doll-62tu2": {
    "recipe": "wm-evo-safe",
    "configId": "wm-female-full-silicone"
  },
  "wm-head-273-163cm-h-cup-silicone-companion-doll-h1zl5": {
    "recipe": "wm-evo-safe",
    "configId": "wm-female-full-silicone"
  },
  "wm-head-583-165cm-d-cup-silicone-companion-doll-2j3mm": {
    "recipe": "wm-evo-safe",
    "configId": "wm-female-full-silicone"
  },
  "wm-head-sn-01-186cm-na-cup-silicone-companion-doll-1y0cj": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "oral-sucking",
        "auto-blowjob-sex-robot"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "super-weight-reduction"
          ]
        },
        {
          "id": "popular",
          "add": [
            "oral-sucking"
          ]
        },
        {
          "id": "premium",
          "add": [
            "auto-blowjob-sex-robot"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-hedy-170cm-m-cup-tpe-companion-doll-1vkpf": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-helfrick-172cm-b-cup-tpe-companion-doll-ru23v": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-hellenbrand-168cm-e-cup-tpe-companion-doll-nb2k4": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-hope-165cm-d-cup-tpe-companion-doll-xzv2z": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-horace-162cm-f-cup-tpe-companion-doll-2pkq3": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-hume-159cm-c-cup-tpe-companion-doll-1kad0": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-hume-166cm-c-cup-tpe-companion-doll-1f744": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-ida-keats-162cm-e-cup-tpe-companion-doll-6z963": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-ida-pritt-159cm-c-cup-tpe-companion-doll-qaat8": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-iris-170cm-m-cup-tpe-companion-doll-1vkqc": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-irmhild-169cm-l-cup-tpe-companion-doll-649u8": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-isabel-175cm-b-cup-tpe-companion-doll-fghx7": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-isabella-156cm-b-cup-tpe-companion-doll-1conp": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-isla-164cm-f-cup-tpe-companion-doll-11dqh": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-jaleesa-156cm-c-cup-tpe-companion-doll-1ll7l": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-jamie-ulysses-164cm-d-cup-tpe-companion-doll-ohj18": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-jamya-173cm-h-cup-tpe-companion-doll-3pej1": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-janica-a-163cm-d-cup-silicone-head-companion-doll-eumvd": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-janica-a-172cm-d-cup-silicone-head-companion-doll-rm3pb": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-jaria-166cm-c-cup-silicone-head-companion-doll-5ch4z": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-jarlath-166cm-c-cup-tpe-companion-doll-220us": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-jasmine-163cm-h-cup-tpe-companion-doll-1tawm": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-jayden-173cm-h-cup-tpe-companion-doll-17ulk": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-jazlynn-150cm-m-cup-tpe-companion-doll-100zi": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-jazmyn-172cm-b-cup-tpe-companion-doll-jx17z": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-jeff-wright-164cm-d-cup-tpe-companion-doll-s9qmf": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-jenna-170cm-m-cup-tpe-companion-doll-yyqkf": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-jessica-156cm-m-cup-tpe-companion-doll-idipe": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-jillian-172cm-d-cup-tpe-companion-doll-1hsq1": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-joanna-158cm-m-cup-tpe-companion-doll-honjb": {
    "recipe": "bespoke",
    "configId": "wm-female-standard-tpe",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": false
    }
  },
  "wm-joanna-ellis-166cm-c-cup-tpe-companion-doll-1xwnu": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-josefina-158cm-n-cup-tpe-companion-doll-170mu": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-josiane-159cm-d-cup-tpe-companion-doll-469c8": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-joyce-156cm-h-cup-tpe-companion-doll-1yyas": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-jullia-172cm-b-cup-tpe-companion-doll-ztnpd": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-june-nico-164cm-d-cup-silicone-head-companion-doll-09ib0": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-kalane-159cm-c-cup-tpe-companion-doll-136v5": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-kale-168cm-i-cup-silicone-head-companion-doll-1jxcv": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-karola-170cm-h-cup-tpe-companion-doll-1ckgq": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-karolann-159cm-d-cup-tpe-companion-doll-ndnzt": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-karuma-164cm-j-cup-tpe-companion-doll-1me07": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-kate-170cm-m-cup-tpe-companion-doll-1vkr9": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-kay-emma-154cm-b-cup-tpe-companion-doll-y8fbt": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-kay-emma-159cm-c-cup-tpe-companion-doll-l8pjx": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-kay-evan-175cm-g-cup-tpe-companion-doll-zirbj": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-kay-terry-159cm-c-cup-tpe-companion-doll-j9d22": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-kay-yoki-159cm-c-cup-tpe-companion-doll-l92d4": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-kayla-163cm-h-cup-tpe-companion-doll-1jqnb": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-kaylen-170cm-m-cup-tpe-companion-doll-iv87o": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-keala-172cm-g-cup-tpe-companion-doll-14y0l": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-kelsey-166cm-c-cup-tpe-companion-doll-1cprm": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-kenisha-169cm-l-cup-tpe-companion-doll-tc1yg": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-keola-169cm-l-cup-tpe-companion-doll-1d990": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-kevina-159cm-d-cup-tpe-companion-doll-1o14e": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-keynes-164cm-f-cup-tpe-companion-doll-1hsyt": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-keziah-169cm-l-cup-tpe-companion-doll-zblad": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-kibby-168cm-e-cup-tpe-companion-doll-ll3gp": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-kily-166cm-c-cup-tpe-companion-doll-1f75s": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-kina-162cm-f-cup-tpe-companion-doll-1v6wb": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-kurimia-164cm-j-cup-tpe-companion-doll-17r1w": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-larlie-160cm-d-cup-tpe-companion-doll-n9vi4": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-laura-gus-159cm-g-cup-tpe-companion-doll-h6s91": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-laurel-170cm-m-cup-tpe-companion-doll-jc7ek": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-lauren-160cm-d-cup-tpe-companion-doll-n9xjg": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-lavinia-170cm-m-cup-tpe-companion-doll-v9vc7": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-lawan-163cm-d-cup-silicone-head-companion-doll-1szfw": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-lawan-172cm-d-cup-silicone-head-companion-doll-1lj1t": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-leah-163cm-h-cup-tpe-companion-doll-438jz": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-lena-eliot-168cm-l-cup-tpe-companion-doll-1bin0": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-lesley-eva-175cm-d-cup-tpe-companion-doll-1v8wi": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-lesley-kit-164cm-f-cup-tpe-companion-doll-1j800": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-leyla-155cm-l-cup-tpe-companion-doll-vmmza": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-lilith-sam-162cm-e-cup-tpe-companion-doll-1fm8b": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-lily-160cm-d-cup-tpe-companion-doll-1jtug": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-lokuzi-168cm-i-cup-silicone-head-companion-doll-1yu8n": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-lorena-150cm-m-cup-tpe-companion-doll-1c58a": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-louise-sally-159cm-c-cup-tpe-companion-doll-6akm3": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-luciana-172cm-d-cup-tpe-companion-doll-hnxt6": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-lydia-170cm-m-cup-tpe-companion-doll-z06pt": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-lyndon-lewis-165cm-l-cup-tpe-companion-doll-12v60": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-lytton-164cm-f-cup-tpe-companion-doll-1ikx9": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-madison-156cm-b-cup-tpe-companion-doll-tyi0z": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-maelia-162cm-f-cup-tpe-companion-doll-4uvn7": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-magali-161cm-g-cup-silicone-head-companion-doll-1bf0u": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-magdalene-164cm-d-cup-tpe-companion-doll-18lpv": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-maidana-172cm-f-cup-tpe-companion-doll-nzky8": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-mandy-170cm-m-cup-tpe-companion-doll-z0be1": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-marina-170cm-m-cup-tpe-companion-doll-jt6xj": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-matt-billy-160cm-i-cup-tpe-companion-doll-1g1xn": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-matt-billy-160cm-i-cup-tpe-companion-doll-hvvqy": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-may-aly-164cm-j-cup-tpe-companion-doll-1rpq1": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-mayme-164cm-d-cup-silicone-companion-doll-a12yu": {
    "recipe": "bespoke",
    "configId": "wm-female-full-silicone",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "vine-talk-ai-box",
        "head-moaning"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "vine-talk-ai-box"
          ]
        },
        {
          "id": "premium",
          "add": [
            "vine-talk-ai-box",
            "head-moaning"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-mayra-155cm-l-cup-tpe-companion-doll-vn483": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-megan-163cm-h-cup-tpe-companion-doll-1jrt2": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-melys-168cm-e-cup-silicone-head-companion-doll-1fdsw": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-meryl-170cm-h-cup-tpe-companion-doll-14juz": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-mia-162cm-e-cup-tpe-companion-doll-vaglo": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-michelle-156cm-h-cup-tpe-companion-doll-4k66s": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-mila-157cm-b-cup-tpe-companion-doll-1dmml": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-milagros-156cm-m-cup-tpe-companion-doll-h797b": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-minana-162cm-f-cup-tpe-companion-doll-4zfit": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-miranda-162cm-e-cup-tpe-companion-doll-bzvep": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-mirta-166cm-c-cup-tpe-companion-doll-oimeg": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-molice-163cm-h-cup-tpe-companion-doll-ocxgr": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-mona-160cm-b-cup-tpe-companion-doll-ennzb": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-montgomery-158cm-g-cup-tpe-companion-doll-brbk9": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-morgan-163cm-h-cup-tpe-companion-doll-od195": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-muna-161cm-g-cup-tpe-companion-doll-dbanu": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-myrna-lucy-160cm-b-cup-tpe-companion-doll-1vih8": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-myrtille-163cm-c-cup-silicone-head-companion-doll-yn9yd": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-natalie-160cm-d-cup-tpe-companion-doll-14kp9": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-nicole-doyle-162cm-f-cup-tpe-companion-doll-106nz": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-niki-157cm-b-cup-tpe-companion-doll-1tihq": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-nina-160cm-d-cup-tpe-companion-doll-1jtvq": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-noemie-174cm-g-cup-tpe-companion-doll-q8a75": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-nuria-166cm-c-cup-tpe-companion-doll-ojdum": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-olivia-150cm-m-cup-tpe-companion-doll-1thpx": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-ombeline-170cm-d-cup-tpe-companion-doll-dz43x": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-onions-164cm-j-cup-tpe-companion-doll-1oh65": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-onni-170cm-d-cup-tpe-companion-doll-od5li": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-oriane-164cm-d-cup-tpe-companion-doll-1hkbp": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-orinda-172cm-g-cup-tpe-companion-doll-1rv24": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-orlando-170cm-h-cup-tpe-companion-doll-9lqch": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-palmer-175cm-b-cup-tpe-companion-doll-ii48a": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-pandora-170cm-h-cup-tpe-companion-doll-g9il8": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-parisa-155cm-l-cup-tpe-companion-doll-1mx6h": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-pasclina-163cm-c-cup-tpe-companion-doll-1lriw": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-patience-155cm-l-cup-tpe-companion-doll-d13xx": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-paula-158cm-g-cup-tpe-companion-doll-fi1s6": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-penelope-164cm-d-cup-tpe-companion-doll-vp3jd": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-perrine-160cm-a-cup-tpe-companion-doll-3g0rr": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-pilar-168cm-i-cup-silicone-head-companion-doll-1c8m6": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-piper-172cm-b-cup-tpe-companion-doll-1akbc": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-pulla-159cm-c-cup-silicone-head-companion-doll-1nzit": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-qiuhai-154cm-b-cup-tpe-companion-doll-uxq9l": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-quintessa-164cm-d-cup-tpe-companion-doll-1ubjh": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-rachel-166cm-c-cup-tpe-companion-doll-1fypu": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-rachel-hal-159cm-c-cup-tpe-companion-doll-htmop": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-rachel-moll-164cm-d-cup-tpe-companion-doll-1k86p": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-rae-morley-160cm-d-cup-tpe-companion-doll-11sef": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-rayna-155cm-l-cup-tpe-companion-doll-vpv6y": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-rebecca-163cm-h-cup-tpe-companion-doll-16ajj": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-red-170cm-d-cup-tpe-companion-doll-gtpje": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-rekeisy-157cm-b-cup-tpe-companion-doll-1mmyu": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-renee-170cm-m-cup-tpe-companion-doll-z34wz": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-renee-blume-162cm-f-cup-tpe-companion-doll-i7v1q": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-renee-judith-159cm-c-cup-tpe-companion-doll-79sc1": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-renee-judith-172cm-b-cup-tpe-companion-doll-duvyx": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-repula-165cm-f-cup-silicone-head-companion-doll-1y3na": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-repula-165cm-f-cup-silicone-head-companion-doll-sdqun": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-reslura-165cm-f-cup-silicone-head-companion-doll-ri9kl": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-rhianna-173cm-h-cup-tpe-companion-doll-1n7ys": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-roifu-172cm-d-cup-silicone-head-companion-doll-1lml8": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-rosaire-160cm-a-cup-tpe-companion-doll-11jii": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-rosalyn-162cm-e-cup-tpe-companion-doll-10cvf": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-rosam-163cm-d-cup-silicone-head-companion-doll-1t2zi": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-ruth-harry-159cm-c-cup-tpe-companion-doll-phftl": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-sachiko-158cm-d-cup-tpe-companion-doll-ttywj": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-sadie-159cm-c-cup-tpe-companion-doll-13tq3": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-sally-a-159cm-c-cup-silicone-head-companion-doll-4qcap": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-sally-bird-164cm-d-cup-tpe-companion-doll-6pxsl": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-samantha-157cm-b-cup-tpe-companion-doll-d0794": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-sanaa-155cm-l-cup-tpe-companion-doll-vqer3": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-sandy-bacon-174cm-g-cup-tpe-companion-doll-1k26e": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-sara-stella-164cm-d-cup-tpe-companion-doll-1egmz": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-sarah-157cm-b-cup-tpe-companion-doll-164q2": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-sarah-zacharias-156cm-b-cup-tpe-companion-doll-b83yr": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-seina-158cm-c-cup-silicone-companion-doll-xhyoo": {
    "recipe": "bespoke",
    "configId": "wm-female-full-silicone",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "vine-talk-ai-box",
        "head-moaning"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "vine-talk-ai-box"
          ]
        },
        {
          "id": "premium",
          "add": [
            "vine-talk-ai-box",
            "head-moaning"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-sela-170cm-m-cup-tpe-companion-doll-1vkwg": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-sentelle-172cm-g-cup-tpe-companion-doll-1yeis": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-shaniya-171cm-h-cup-tpe-companion-doll-kx8q4": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-shelley-julius-156cm-b-cup-tpe-companion-doll-1nyx1": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-sierra-172cm-d-cup-tpe-companion-doll-qm5b3": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-skristin-hutt-156cm-b-cup-tpe-companion-doll-u7cyp": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-slowe-172cm-g-cup-tpe-companion-doll-152jp": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-sofia-163cm-h-cup-tpe-companion-doll-1jva7": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-soizic-164cm-f-cup-tpe-companion-doll-1lqjr": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-sophia-156cm-b-cup-tpe-companion-doll-1tw4s": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-sophie-160cm-d-cup-tpe-companion-doll-qsum9": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-southey-157cm-b-cup-tpe-companion-doll-76gs2": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-southey-162cm-e-cup-tpe-companion-doll-vxe6k": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-southey-164cm-e-cup-tpe-companion-doll-dr8bs": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-ss174-173cm-h-cup-silicone-head-companion-doll-nerg3": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-ss226-163cm-d-cup-silicone-head-companion-doll-1t3kh": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-ss273-163cm-d-cup-silicone-head-companion-doll-1t3ki": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-stacy-162cm-e-cup-tpe-companion-doll-oa1l0": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-sulia-165cm-f-cup-silicone-head-companion-doll-1mg7e": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-sulwha-172cm-f-cup-tpe-companion-doll-t4jul": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-susha-154cm-b-cup-silicone-head-companion-doll-jceq7": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-susha-166cm-c-cup-silicone-head-companion-doll-5hs2s": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-sutta-165cm-f-cup-silicone-head-companion-doll-1jxhu": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-sylvia-nick-165cm-l-cup-tpe-companion-doll-n9jkn": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-taletta-156cm-h-cup-tpe-companion-doll-1svay": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-talitha-156cm-h-cup-tpe-companion-doll-1svdi": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-tami-156cm-h-cup-tpe-companion-doll-17jc9": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-tamila-162cm-f-cup-tpe-companion-doll-86c1q": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-tammy-170cm-h-cup-tpe-companion-doll-14nmv": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-tammy-wat-162cm-e-cup-tpe-companion-doll-beuoz": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-taylor-160cm-b-cup-tpe-companion-doll-oqoic": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-taylor-broad-168cm-d-cup-tpe-companion-doll-4360e": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-tecla-158cm-n-cup-tpe-companion-doll-1rrm5": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-teela-172cm-g-cup-tpe-companion-doll-152yt": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-terry-173cm-h-cup-tpe-companion-doll-3uz4h": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-teva-160cm-a-cup-tpe-companion-doll-1t3so": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-thomson-164cm-d-cup-tpe-companion-doll-oife4": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-thoreau-164cm-d-cup-tpe-companion-doll-oiiac": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-tiffany-166cm-c-cup-tpe-companion-doll-adf72": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-tiffany-bruno-166cm-c-cup-tpe-companion-doll-1yp4c": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-timotha-152cm-g-cup-tpe-companion-doll-uiq00": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-tobey-155cm-l-cup-tpe-companion-doll-vr78p": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-toby-155cm-l-cup-tpe-companion-doll-h2afu": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-toini-155cm-l-cup-tpe-companion-doll-vr7e3": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-traci-170cm-m-cup-tpe-companion-doll-z4gjb": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-tresha-155cm-l-cup-tpe-companion-doll-1p2hd": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-trisha-162cm-b-cup-tpe-companion-doll-3s9b6": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-truda-166cm-c-cup-tpe-companion-doll-ommrb": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-trudy-162cm-e-cup-tpe-companion-doll-oakih": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-tseven-174cm-g-cup-tpe-companion-doll-t4rah": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-twyla-162cm-f-cup-tpe-companion-doll-n6rlt": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-tya-160cm-a-cup-tpe-companion-doll-dk1lb": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-tyrone-jessie-164cm-d-cup-silicone-head-companion-doll-nzixe": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-undine-166cm-c-cup-tpe-companion-doll-1hl0o": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-ursula-166cm-c-cup-tpe-companion-doll-1hnho": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-ute-166cm-c-cup-tpe-companion-doll-1drp7": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-valencia-166cm-c-cup-tpe-companion-doll-1firl": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-valentina-167cm-f-cup-tpe-companion-doll-rho32": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-vanna-a-166cm-c-cup-silicone-head-companion-doll-1ltts": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-vanna-b-166cm-c-cup-silicone-head-companion-doll-1ltts": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-vanora-151cm-e-cup-tpe-companion-doll-ve922": {
    "recipe": "bespoke",
    "configId": "wm-female-standard-tpe",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": false
    }
  },
  "wm-venus-170cm-m-cup-tpe-companion-doll-z5c3q": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-venus-josh-175cm-b-cup-tpe-companion-doll-5aze4": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-vera-151cm-e-cup-tpe-companion-doll-1qghg": {
    "recipe": "bespoke",
    "configId": "wm-female-standard-tpe",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": false
    }
  },
  "wm-vera-broad-163cm-c-cup-tpe-companion-doll-mjkqy": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-victormia-160cm-d-cup-tpe-companion-doll-vqy5y": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-virgee-168cm-f-cup-tpe-companion-doll-r18zj": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-waltraud-171cm-h-cup-tpe-companion-doll-r75sk": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-weitta-172cm-d-cup-silicone-head-companion-doll-vfx64": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-wendy-163cm-h-cup-tpe-companion-doll-1jxb6": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-wendy-grant-160cm-b-cup-tpe-companion-doll-1jdzy": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-wenona-171cm-h-cup-tpe-companion-doll-8km1w": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-whille-160cm-i-cup-tpe-companion-doll-123ru": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-whitney-172cm-d-cup-tpe-companion-doll-uzzsf": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-wickwire-163cm-c-cup-tpe-companion-doll-ecdnb": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-willa-172cm-b-cup-tpe-companion-doll-1ao5t": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-willow-172cm-b-cup-tpe-companion-doll-q6rp2": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-wilma-172cm-d-cup-tpe-companion-doll-18gdg": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-winifred-172cm-d-cup-tpe-companion-doll-1igsk": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-winni-philip-162cm-f-cup-tpe-companion-doll-p9to8": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-winnie-172cm-d-cup-tpe-companion-doll-sihgd": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-winona-164cm-d-cup-tpe-companion-doll-1l7u0": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-wynne-164cm-d-cup-tpe-companion-doll-orls5": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-xena-164cm-d-cup-tpe-companion-doll-1v8wl": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-xenia-164cm-d-cup-tpe-companion-doll-orssw": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-y017-165cm-g-cup-silicone-companion-doll-whgkh": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-y019-157cm-b-cup-silicone-companion-doll-txhmc": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-yadira-173cm-h-cup-tpe-companion-doll-1exwl": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-yaelle-160cm-a-cup-tpe-companion-doll-1pg9n": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-yccio-mary-168cm-d-cup-tpe-companion-doll-h7h6f": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "wm-yoiko-158cm-c-cup-silicone-head-companion-doll-1bn52": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-yulady-172cm-d-cup-silicone-head-companion-doll-e35ag": {
    "recipe": "wm-heating",
    "configId": "wm-female-silicone-head-tpe"
  },
  "wm-zenobiam-172cm-d-cup-tpe-companion-doll-ba6tp": {
    "recipe": "bespoke",
    "configId": "wm-product-specific",
    "bespoke": {
      "groupId": "premium-head-body-options",
      "managedOptionIds": [
        "body-heating",
        "breathing-system"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "hyper-realism-body-painting-free"
          ]
        },
        {
          "id": "popular",
          "add": [
            "body-heating"
          ]
        },
        {
          "id": "premium",
          "add": [
            "body-heating",
            "breathing-system"
          ]
        }
      ],
      "applyWmGuard": true
    }
  },
  "wm-zoe-163cm-h-cup-tpe-companion-doll-707xi": {
    "recipe": "wm-heating",
    "configId": "wm-female-standard-tpe"
  },
  "yl-abigale-171cm-m-cup-tpe-companion-doll-14ow4": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-adeline-171cm-m-cup-tpe-companion-doll-15kvj": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-airelia-151cm-e-cup-tpe-companion-doll-6rrpg": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-annabelle-155cm-h-cup-tpe-companion-doll-fhhrn": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-cannelle-151cm-e-cup-tpe-companion-doll-6bcr7": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-cassandra-171cm-m-cup-tpe-companion-doll-ub5a6": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-catherine-171cm-m-cup-tpe-companion-doll-13ubj": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-chelsea-171cm-m-cup-tpe-companion-doll-1sqr0": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-clara-153cm-n-cup-tpe-companion-doll-139fo": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-cornelia-153cm-n-cup-tpe-companion-doll-176lq": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-dafna-153cm-n-cup-tpe-companion-doll-139sj": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-daphnca-153cm-n-cup-tpe-companion-doll-n5mzc": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-deirdre-158cm-m-cup-tpe-companion-doll-td83x": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-diego-153cm-n-cup-tpe-companion-doll-139xm": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-dolores-167cm-d-cup-tpe-companion-doll-ge9f9": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-dorinda-165cm-g-cup-tpe-companion-doll-1070p": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-eunice-ivan-171cm-m-cup-tpe-companion-doll-1e1wk": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-eveline-153cm-g-cup-tpe-companion-doll-1bm01": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-fay-158cm-m-cup-tpe-companion-doll-1908p": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-fayna-158cm-m-cup-tpe-companion-doll-1snr4": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-frantiska-153cm-n-cup-tpe-companion-doll-kq0mz": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-giuliana-151cm-e-cup-tpe-companion-doll-t7yup": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-greta-148cm-h-cup-tpe-companion-doll-xg92b": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-gulzar-167cm-d-cup-tpe-companion-doll-19kqr": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-hebe-148cm-h-cup-tpe-companion-doll-uv708": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-heidi-148cm-h-cup-tpe-companion-doll-xgkmo": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-helena-148cm-h-cup-tpe-companion-doll-16u8p": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-irene-148cm-h-cup-tpe-companion-doll-xhcnd": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-iris-quiller-170cm-g-cup-tpe-companion-doll-whtha": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-ishara-148cm-h-cup-tpe-companion-doll-17iws": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-isla-158cm-e-cup-silicone-companion-doll-13w23": {
    "recipe": "bespoke",
    "configId": "yl-source-verified",
    "bespoke": {
      "groupId": "premium-body-options-multiple",
      "managedOptionIds": [
        "head-moaning",
        "implanted-eyebrows"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "no-add-on"
          ]
        },
        {
          "id": "popular",
          "add": [
            "head-moaning"
          ]
        },
        {
          "id": "premium",
          "add": [
            "head-moaning",
            "implanted-eyebrows"
          ]
        }
      ],
      "applyWmGuard": false
    }
  },
  "yl-isla-158cm-e-cup-silicone-companion-doll-1iikg": {
    "recipe": "bespoke",
    "configId": "yl-source-verified",
    "bespoke": {
      "groupId": "premium-body-options-multiple",
      "managedOptionIds": [
        "head-moaning",
        "implanted-eyebrows"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "no-add-on"
          ]
        },
        {
          "id": "popular",
          "add": [
            "head-moaning"
          ]
        },
        {
          "id": "premium",
          "add": [
            "head-moaning",
            "implanted-eyebrows"
          ]
        }
      ],
      "applyWmGuard": false
    }
  },
  "yl-jacqueline-148cm-h-cup-tpe-companion-doll-1uycc": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-jamie-148cm-h-cup-tpe-companion-doll-xhlqz": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-jane-148cm-h-cup-tpe-companion-doll-uv87i": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-janet-148cm-h-cup-tpe-companion-doll-xhlrn": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-jean-148cm-h-cup-tpe-companion-doll-uv8a6": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-jenny-148cm-h-cup-tpe-companion-doll-xhobt": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-jill-158cm-e-cup-silicone-companion-doll-1iikw": {
    "recipe": "bespoke",
    "configId": "yl-source-verified",
    "bespoke": {
      "groupId": "premium-body-options-multiple",
      "managedOptionIds": [
        "head-moaning",
        "implanted-eyebrows"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "no-add-on"
          ]
        },
        {
          "id": "popular",
          "add": [
            "head-moaning"
          ]
        },
        {
          "id": "premium",
          "add": [
            "head-moaning",
            "implanted-eyebrows"
          ]
        }
      ],
      "applyWmGuard": false
    }
  },
  "yl-joanna-158cm-m-cup-tpe-companion-doll-honjb": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-jocelyn-158cm-m-cup-tpe-companion-doll-1f1f2": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-josephine-148cm-h-cup-tpe-companion-doll-bj02a": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-judith-148cm-g-cup-tpe-companion-doll-7cldm": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-judy-148cm-g-cup-tpe-companion-doll-aa4zp": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-judy-153cm-e-cup-silicone-companion-doll-2wkbf": {
    "recipe": "bespoke",
    "configId": "yl-source-verified",
    "bespoke": {
      "groupId": "premium-body-options-multiple",
      "managedOptionIds": [
        "head-moaning",
        "implanted-eyebrows"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "no-add-on"
          ]
        },
        {
          "id": "popular",
          "add": [
            "head-moaning"
          ]
        },
        {
          "id": "premium",
          "add": [
            "head-moaning",
            "implanted-eyebrows"
          ]
        }
      ],
      "applyWmGuard": false
    }
  },
  "yl-julia-148cm-g-cup-tpe-companion-doll-yluoq": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-juliana-148cm-g-cup-tpe-companion-doll-evgiz": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-julie-148cm-g-cup-tpe-companion-doll-yluoq": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-june-148cm-g-cup-tpe-companion-doll-aa4zx": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-karen-160cm-p-cup-tpe-companion-doll-cn40s": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-kathie-160cm-p-cup-tpe-companion-doll-10qxq": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-katrina-160cm-p-cup-tpe-companion-doll-2pfjs": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-kiriko-155cm-j-cup-silicone-companion-doll-1dm4j": {
    "recipe": "bespoke",
    "configId": "yl-source-verified",
    "bespoke": {
      "groupId": "premium-body-options-multiple",
      "managedOptionIds": [
        "head-moaning",
        "implanted-eyebrows"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "no-add-on"
          ]
        },
        {
          "id": "popular",
          "add": [
            "head-moaning"
          ]
        },
        {
          "id": "premium",
          "add": [
            "head-moaning",
            "implanted-eyebrows"
          ]
        }
      ],
      "applyWmGuard": false
    }
  },
  "yl-kishi-160cm-p-cup-tpe-companion-doll-cn95h": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-kitty-150cm-n-cup-tpe-companion-doll-1qaiv": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-lareina-160cm-p-cup-tpe-companion-doll-hchy0": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-laura-160cm-p-cup-tpe-companion-doll-cnnvw": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-lena-160cm-p-cup-tpe-companion-doll-iqlmw": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-lillian-160cm-p-cup-tpe-companion-doll-l1om7": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-linda-louis-170cm-g-cup-tpe-companion-doll-1fao8": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-lorraine-160cm-p-cup-tpe-companion-doll-x4vu7": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-louise-160cm-p-cup-tpe-companion-doll-11fp5": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-lucia-160cm-p-cup-tpe-companion-doll-co0a3": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-lucine-160cm-p-cup-tpe-companion-doll-11iof": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-lucy-camilla-171cm-m-cup-tpe-companion-doll-1o5tk": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-lulu-160cm-p-cup-tpe-companion-doll-iqlyq": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-lynn-160cm-n-cup-tpe-companion-doll-1cliu": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-mariah-165cm-g-cup-tpe-companion-doll-11akc": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-mavis-165cm-g-cup-tpe-companion-doll-1k70e": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-maxine-165cm-g-cup-tpe-companion-doll-11ao7": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-melissa-165cm-g-cup-tpe-companion-doll-lemae": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-melody-165cm-g-cup-tpe-companion-doll-11cnt": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-meredith-165cm-g-cup-tpe-companion-doll-r2z97": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-micaela-153cm-n-cup-tpe-companion-doll-gs2fh": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-miriam-165cm-g-cup-tpe-companion-doll-11eyp": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-monica-165cm-g-cup-tpe-companion-doll-11i6x": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-nikita-166cm-n-cup-tpe-companion-doll-rgr98": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-olina-166cm-n-cup-tpe-companion-doll-ccxnm": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-oprah-166cm-n-cup-tpe-companion-doll-cd0dy": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-orli-170cm-g-cup-tpe-companion-doll-f3chp": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-palmira-153cm-n-cup-tpe-companion-doll-1l627": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-pamela-166cm-n-cup-tpe-companion-doll-sahc3": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-panam-153cm-e-cup-silicone-companion-doll-j3bz0": {
    "recipe": "bespoke",
    "configId": "yl-source-verified",
    "bespoke": {
      "groupId": "premium-body-options-multiple",
      "managedOptionIds": [
        "head-moaning",
        "implanted-eyebrows"
      ],
      "tiers": [
        {
          "id": "starter",
          "add": [
            "no-add-on"
          ]
        },
        {
          "id": "popular",
          "add": [
            "head-moaning"
          ]
        },
        {
          "id": "premium",
          "add": [
            "head-moaning",
            "implanted-eyebrows"
          ]
        }
      ],
      "applyWmGuard": false
    }
  },
  "yl-patchan-151cm-e-cup-tpe-companion-doll-a331s": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-pauline-166cm-n-cup-tpe-companion-doll-os3j4": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-pearl-168cm-f-cup-tpe-companion-doll-kjvom": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-peggy-168cm-f-cup-tpe-companion-doll-kjvst": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-philomena-168cm-f-cup-tpe-companion-doll-i7112": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-priscilla-168cm-f-cup-tpe-companion-doll-pfgym": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-prudencia-153cm-n-cup-tpe-companion-doll-ae7tp": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-quentina-168cm-f-cup-tpe-companion-doll-11cel": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-raquel-153cm-n-cup-tpe-companion-doll-gjhwm": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-ritamargaet-168cm-f-cup-tpe-companion-doll-1dyw9": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-roxanne-168cm-f-cup-tpe-companion-doll-ytvhp": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-ruth-168cm-f-cup-tpe-companion-doll-c4cl2": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-sabrina-168cm-f-cup-tpe-companion-doll-1a91d": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-samuel-170cm-g-cup-tpe-companion-doll-focdn": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-sandra-170cm-g-cup-tpe-companion-doll-fococ": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-serena-170cm-g-cup-tpe-companion-doll-fqmfa": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-sharon-170cm-g-cup-tpe-companion-doll-frz7z": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-shelley-170cm-g-cup-tpe-companion-doll-1qyqt": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-shirley-170cm-g-cup-tpe-companion-doll-1r11t": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-silvia-170cm-g-cup-tpe-companion-doll-fsq48": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-sirena-155cm-h-cup-tpe-companion-doll-1jtcq": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-slema-170cm-g-cup-tpe-companion-doll-15r1s": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-stella-170cm-g-cup-tpe-companion-doll-fyn6i": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-thera-bell-170cm-g-cup-tpe-companion-doll-i2kvr": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-tina-170cm-g-cup-tpe-companion-doll-f3fi0": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-ula-150cm-n-cup-tpe-companion-doll-w2i4h": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-ummi-150cm-n-cup-tpe-companion-doll-1yr56": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-vala-155cm-h-cup-tpe-companion-doll-5r0zx": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-valencia-155cm-h-cup-tpe-companion-doll-1bh97": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-valentina-155cm-h-cup-tpe-companion-doll-1f8yx": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-valonia-155cm-h-cup-tpe-companion-doll-1toyq": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-valora-155cm-h-cup-tpe-companion-doll-1l3zm": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-vanessa-170cm-g-cup-tpe-companion-doll-wsc3j": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-vanna-151cm-e-cup-tpe-companion-doll-icwuy": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-vanora-151cm-e-cup-tpe-companion-doll-ve922": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-velika-151cm-e-cup-tpe-companion-doll-xk0u9": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-vera-151cm-e-cup-tpe-companion-doll-1qghg": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-verna-157cm-h-cup-tpe-companion-doll-152jt": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-vesta-151cm-e-cup-tpe-companion-doll-iczir": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-vevina-151cm-e-cup-tpe-companion-doll-xqes4": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-violet-150cm-n-cup-tpe-companion-doll-ifm5o": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-viridis-150cm-n-cup-tpe-companion-doll-1wj8s": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-viveka-150cm-n-cup-tpe-companion-doll-ifqhj": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-vivienne-150cm-n-cup-tpe-companion-doll-vf3zd": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-willow-155cm-h-cup-tpe-companion-doll-1lpfj": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-wilma-155cm-h-cup-tpe-companion-doll-108br": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-wilona-155cm-h-cup-tpe-companion-doll-1lpfl": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-winema-155cm-h-cup-tpe-companion-doll-1lpgn": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-winnie-170cm-g-cup-tpe-companion-doll-hoxpv": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-winola-155cm-h-cup-tpe-companion-doll-1lpgv": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-winona-155cm-h-cup-tpe-companion-doll-1lpgv": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-xenia-155cm-h-cup-tpe-companion-doll-108t1": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-xylona-155cm-h-cup-tpe-companion-doll-1mf9x": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-yasmin-155cm-h-cup-tpe-companion-doll-1mj8w": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-yasmine-158cm-m-cup-tpe-companion-doll-1fqc7": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-yelena-155cm-h-cup-tpe-companion-doll-1mlbg": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-yolanda-170cm-g-cup-tpe-companion-doll-cdvcj": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-yonina-155cm-h-cup-tpe-companion-doll-1mqur": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-yoric-151cm-e-cup-tpe-companion-doll-iet9e": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-yuki-155cm-d-cup-tpe-companion-doll-1tgwx": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-yvette-160cm-p-cup-tpe-companion-doll-17out": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-yvonnet-153cm-n-cup-tpe-companion-doll-1l70t": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-zahara-157cm-h-cup-tpe-companion-doll-1vhyj": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-zahirah-157cm-h-cup-tpe-companion-doll-wkmpw": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-zea-157cm-h-cup-tpe-companion-doll-l3w68": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-zenobia-151cm-e-cup-tpe-companion-doll-glx1n": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-zerlinda-157cm-h-cup-tpe-companion-doll-7seqo": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-zeva-157cm-h-cup-tpe-companion-doll-f2ovt": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-zinia-157cm-h-cup-tpe-companion-doll-154th": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-ziva-157cm-h-cup-tpe-companion-doll-1az30": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-zoey-171cm-m-cup-tpe-companion-doll-yc9mo": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-zole-155cm-b-cup-tpe-companion-doll-oaq7p": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-zula-155cm-d-cup-tpe-companion-doll-1tgxk": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  },
  "yl-zuzanny-155cm-d-cup-tpe-companion-doll-1ozwz": {
    "recipe": "yl-tpe",
    "configId": "yl-source-verified"
  }
};
export const reviewedPresetHandleCount = 604;
