import "server-only";
import { createHash } from "node:crypto";
import type { Product } from "@/types/product";
import { productPdpHeading } from "./naming";

type ReviewedLook = { id: string; handle: string; imageFingerprint: string; label: string };

// Image-bound visual labels describe a gallery, not included clothing or upgrades.
const reviewedLooks: ReviewedLook[] = [
  { id: "gid://shopify/Product/10518049226936", handle: "irontech-rita-165cm-g-cup-hybrid-companion-doll-1laqf", imageFingerprint: "aff997591421d15eaf50e013b6eac76645cd8f3db23c45f671834963965acbba", label: "Denim Gallery" },
  { id: "gid://shopify/Product/10518045229240", handle: "irontech-rita-165cm-g-cup-hybrid-companion-doll-eli3u", imageFingerprint: "8e638d5d8032c01de53ae23f63373a91dd03432cd21fe08d636fa56545be4df8", label: "Cream Knit Gallery" },
  { id: "gid://shopify/Product/10518049063096", handle: "irontech-kitty-166cm-d-cup-silicone-companion-doll-1s0dp", imageFingerprint: "9ab0643ad484e4d6cfc29cb239804bd055e8bd6b7092a6878f0dd8f728f9158f", label: "White Halter Gallery" },
  { id: "gid://shopify/Product/10518048506040", handle: "irontech-kitty-166cm-d-cup-silicone-companion-doll-1e8wo", imageFingerprint: "7c247f2afc730eb02b4d505ddc7d341faf1f6866824d62b13c35e38bd7a92ec5", label: "Gold Adornments Gallery" },
  { id: "gid://shopify/Product/10518048473272", handle: "irontech-zara-166cm-c-cup-silicone-companion-doll-h02oi", imageFingerprint: "78ecc1ef2ce8d2bcd8f8ead881bab3d10ce12356cd478167378b133884336c84", label: "Black Dress Gallery" },
  { id: "gid://shopify/Product/10518047883448", handle: "irontech-zara-166cm-c-cup-silicone-companion-doll-1vnvl", imageFingerprint: "385b416e048ec16f3d7646140343df4d4b1206e34c44b2b3882ccadef1997c76", label: "Yellow and Floral Gallery" },
  { id: "gid://shopify/Product/10518048178360", handle: "irontech-luna-164cm-f-cup-silicone-companion-doll-1k1yp", imageFingerprint: "65f3bd94bf335e737c90b9b1df3f0c32996edd949aa2c820dbe33f502ac77611", label: "White Sportswear Gallery" },
  { id: "gid://shopify/Product/10433357971640", handle: "irontech-luna-164cm-f-cup-silicone-companion-doll-r0bub", imageFingerprint: "53a7f8b467547358384c06e77f69853df1dd098ad08ab1205af2d5f13dbd0aaf", label: "Grey Jacket Gallery" },
  { id: "gid://shopify/Product/10518047523000", handle: "irontech-luna-168cm-b-cup-silicone-companion-doll-nvkut", imageFingerprint: "9e26ff1fb0b363034f54713f50b6683a582ccd255860c4250c7f2bef9a377ca8", label: "Crochet and Denim Gallery" },
  { id: "gid://shopify/Product/10518044246200", handle: "irontech-luna-168cm-b-cup-silicone-companion-doll-30cz3", imageFingerprint: "4b7d66f2565141653bef284e258a75d23ed39ec3cb737d09c40fa67da80374c0", label: "Dark-Haired Portrait Gallery" },
  { id: "gid://shopify/Product/10518047457464", handle: "irontech-kitty-165cm-g-cup-hybrid-companion-doll-d3pru", imageFingerprint: "c18884e6ce0cd50907375bc34fe05eeec358968e67ef8fab298a26567ce68dae", label: "White Fur Boots Gallery" },
  { id: "gid://shopify/Product/10518047064248", handle: "irontech-kitty-165cm-g-cup-hybrid-companion-doll-1tnqt", imageFingerprint: "472f4cf562a4fd5fa14bd0877d29f1ed3fe07f2666329a277c509366d4803d16", label: "Olive Top Gallery" },
  { id: "gid://shopify/Product/10518047195320", handle: "irontech-maria-165cm-g-cup-hybrid-companion-doll-e25at", imageFingerprint: "c443b67f916a5be47f8ce5429164c2d58d436ffa764ace56a2e8b444609630b1", label: "Pink Knit Gallery" },
  { id: "gid://shopify/Product/10518046965944", handle: "irontech-maria-165cm-g-cup-hybrid-companion-doll-k5r8o", imageFingerprint: "41a29fdd200867263a020d5d99cfc3b436981d2d58737afc90f48845d58777df", label: "Grey Knit Gallery" },
  { id: "gid://shopify/Product/10518046933176", handle: "irontech-flora-163cm-b-cup-silicone-companion-doll-p88m9", imageFingerprint: "dc5b299e6c0a62822187b6ce1c51c3ff7bfb40c163d53acd2e89ecdabf6b400a", label: "Fur Trim Gallery" },
  { id: "gid://shopify/Product/10518045786296", handle: "irontech-flora-163cm-b-cup-silicone-companion-doll-nenkw", imageFingerprint: "3f8dba84764cfbb062f7c75170b1778af59e26ec7d60eeac3ba4b8a985d1d5e5", label: "Pink Ruffles Gallery" },
  { id: "gid://shopify/Product/10518046343352", handle: "irontech-bill-176cm-silicone-companion-doll-9p4go", imageFingerprint: "e56dae7f66b6dfe881fddfdc8ec840a73f4a95499abb6f31be58195182c957e3", label: "Black Vest Gallery" },
  { id: "gid://shopify/Product/10518046310584", handle: "irontech-bill-176cm-silicone-companion-doll-1afef", imageFingerprint: "d7f6ab2af0e93beb3f2b6b0b080b5d7fc44cfd79fd0b195433fa9b828dc16279", label: "Leather Cap Gallery" },
  { id: "gid://shopify/Product/10518045687992", handle: "irontech-molly-169cm-c-cup-hybrid-companion-doll-34syg", imageFingerprint: "580612bfa613e7e262f7d32264e76f10deb1651d953dd994e1bc7fcc5e0a2c8f", label: "Black Corset Gallery" },
  { id: "gid://shopify/Product/10518042771640", handle: "irontech-molly-169cm-c-cup-hybrid-companion-doll-ry9j4", imageFingerprint: "80038fdb729bce98651a2f9afa6335fdeab32d15af9348246aba6ba75bb16a09", label: "Guitar Gallery" },
  { id: "gid://shopify/Product/10518045262008", handle: "irontech-tina-159cm-g-cup-hybrid-companion-doll-1fqi2", imageFingerprint: "9d53245ad19a86b9f3fd0e8a1907a3aa649472f4d8d04d7b6ecebe06359b8ef7", label: "Floral Dress Gallery" },
  { id: "gid://shopify/Product/10518042280120", handle: "irontech-tina-159cm-g-cup-hybrid-companion-doll-1woi6", imageFingerprint: "b2dd4d5631862dae8c6ef0539847910d702d1d46cc2d2b45ef471e7966e2d260", label: "Cream Blouse Gallery" },
  { id: "gid://shopify/Product/10518045098168", handle: "irontech-yeona-162cm-a-cup-hybrid-companion-doll-1m2w2", imageFingerprint: "5cf8a671c68347994c6ee3152b0732f70cdac0c01aed2d3fe683b4f44db99b16", label: "Purple Dress Gallery" },
  { id: "gid://shopify/Product/10518044410040", handle: "irontech-yeona-162cm-a-cup-hybrid-companion-doll-1gg63", imageFingerprint: "e6305bd721dd7e6988d8888e34bdb6bc56f6a6c9edcfd59fec4a3281835de527", label: "Glasses Gallery" },
  { id: "gid://shopify/Product/10518044311736", handle: "irontech-cherry-169cm-c-cup-hybrid-companion-doll-l9ehk", imageFingerprint: "dcaaed340ba514716f9f92f363574c43f1480fcd8fe5b51310a906284ea27f59", label: "Tavern Gallery" },
  { id: "gid://shopify/Product/10518042837176", handle: "irontech-cherry-169cm-c-cup-hybrid-companion-doll-1a4ex", imageFingerprint: "ca66e141ba4e05401ca492895efc618169c73da91d48e43999560c76d245acbc", label: "Lavender Hair Gallery" },
  { id: "gid://shopify/Product/10518043394232", handle: "irontech-miku-161cm-f-cup-hybrid-companion-doll-13bhx", imageFingerprint: "4941f6202766bba880d9d0a3af26b43c458b8be92a568735463d19fa400cb517", label: "Football Gallery" },
  { id: "gid://shopify/Product/10518043361464", handle: "irontech-miku-161cm-f-cup-hybrid-companion-doll-1wj6b", imageFingerprint: "e91c7419f87ba8fab7058358734801e15e07959e259272fc77a0cb331277ec55", label: "Red Shorts Gallery" },
  { id: "gid://shopify/Product/10518043328696", handle: "irontech-penny-161cm-f-cup-hybrid-companion-doll-dej1w", imageFingerprint: "08e3940e9d97bb9ced5935706f0aa9ca40a707ccd2a85a52c4c723adb8d18507", label: "Red Bandana Gallery" },
  { id: "gid://shopify/Product/10518043263160", handle: "irontech-penny-161cm-f-cup-hybrid-companion-doll-bf470", imageFingerprint: "8f419b57a0e32a41d26fbddccbe418e9eb2f91de89394890f3beb8306538bd6c", label: "Black Lace Gallery" },
  { id: "gid://shopify/Product/10518043230392", handle: "irontech-celine-162cm-g-cup-hybrid-companion-doll-1fwfb", imageFingerprint: "fad921990c2091b202c37982c47449f77c0e2abb956a2a718dd1f5ae6cad5757", label: "Grey Robe Gallery" },
  { id: "gid://shopify/Product/10518043197624", handle: "irontech-celine-162cm-g-cup-hybrid-companion-doll-cvno6-2", imageFingerprint: "a020bb5466d3d55ade61aca65d5842082dc1836d05fda3a7b8ecaf707f0300fb", label: "Gold Bikini Gallery" },
  { id: "gid://shopify/Product/10518043132088", handle: "irontech-celine-162cm-g-cup-hybrid-companion-doll-cvno6", imageFingerprint: "8c403c64b332364e85a1b4af62d9d23e49532f111db4910558d7974bb3941cbb", label: "Police Costume Gallery" },
  { id: "gid://shopify/Product/10454996123832", handle: "irontech-thomas-head-m5-170cm-silicone-look-2-companion-doll-l8a9y", imageFingerprint: "7af1ab706f0124a6a3f2239b65b774632e1851045680be3afe96160ad10c34de", label: "Spotted Coat Gallery" },
  { id: "gid://shopify/Product/10454995894456", handle: "irontech-thomas-head-m5-170cm-silicone-companion-doll-1loac", imageFingerprint: "26643e58adf3dcfcb36079bd06d4364df680888e2e375eff09f3f857257edc8f", label: "Trident Gallery" },
  { id: "gid://shopify/Product/10454996058296", handle: "irontech-lucas-head-m9-170cm-silicone-look-2-companion-doll-1kqi2", imageFingerprint: "19b83dabbe1c364122319b71dbadf918ac37ff845d6f515a21d3425cc7ca936e", label: "Doctor Costume Gallery" },
  { id: "gid://shopify/Product/10454996025528", handle: "irontech-lucas-head-m9-170cm-silicone-companion-doll-16qxd", imageFingerprint: "a54403aa756b9b46b0585e20410e77ec90130c4f95072cbda6979723e1e1fe0d", label: "Striped Shirt Gallery" },
  { id: "gid://shopify/Product/10433363443896", handle: "irontech-eileen-164cm-f-cup-silicone-head-companion-doll-qa1in", imageFingerprint: "4406cf25009366e1f098acd82545d04c09e80e923cb3e5d68e3df4ccc90641af", label: "Black Corset Gallery" },
  { id: "gid://shopify/Product/10433362788536", handle: "irontech-eileen-164cm-f-cup-silicone-head-companion-doll-5wkx7-2", imageFingerprint: "44d815305e5c47f76fde353e6ca2220c385d12f3962559dda8494f94b7e088ba", label: "White Corset Gallery" },
  { id: "gid://shopify/Product/10433360003256", handle: "irontech-eileen-164cm-f-cup-silicone-head-companion-doll-5wkx7", imageFingerprint: "760a3391bcc7e66ad066c2fc285027510e514a6ef5b3b801e238b48e51e4c168", label: "Long Waves Gallery" },
  { id: "gid://shopify/Product/10433359904952", handle: "irontech-eileen-164cm-f-cup-silicone-head-companion-doll-nidst", imageFingerprint: "67804eea2ed005ddc077bd34d6548f4c3a3a278731d5963380175d8199f50e70", label: "Ivory Dress Gallery" },
  { id: "gid://shopify/Product/10433358201016", handle: "irontech-eileen-164cm-f-cup-silicone-companion-doll-5wkx7", imageFingerprint: "9ca9087104794c92c72b0527d744a2bae4389338ce3c78a1c8ea6ff1bc7b0393", label: "White Lingerie Gallery" },
  { id: "gid://shopify/Product/10433354334392", handle: "irontech-eileen-164cm-f-cup-silicone-head-companion-doll-1abea", imageFingerprint: "ae5ae5c040b3a5696890cc94ad30ea0c0d61764984ac682a72c41728e16e2f76", label: "Garden Bikini Gallery" },
  { id: "gid://shopify/Product/10433363148984", handle: "irontech-celine-164cm-f-cup-silicone-head-companion-doll-1t5v3", imageFingerprint: "6104653133430116d0e10ca3767d70588905cd3ae448976ce99a80e4a9684d0f", label: "Western Hat Gallery" },
  { id: "gid://shopify/Product/10433359806648", handle: "irontech-celine-164cm-f-cup-silicone-head-companion-doll-mi3gt", imageFingerprint: "4e4925e1eb8e33c0436c00141b5f7ec4f9da5927711cc5f9ea24692fdca91a98", label: "Window Seat Gallery" },
  { id: "gid://shopify/Product/10433354301624", handle: "irontech-celine-164cm-f-cup-silicone-head-companion-doll-19b3y", imageFingerprint: "55219af1c4ca833dd6b3da315fddd794c94bb58d68378c1caf1cf163a367df0a", label: "Red Bikini Gallery" },
  { id: "gid://shopify/Product/10433362133176", handle: "irontech-bailey-164cm-f-cup-silicone-head-companion-doll-dslba", imageFingerprint: "0eefc1c2b999c03999f7c504bd9cc985144195fb7a9171bd99ec2c0aecd79440", label: "Red Hair Gallery" },
  { id: "gid://shopify/Product/10433358102712", handle: "irontech-bailey-164cm-f-cup-silicone-companion-doll-lyst4", imageFingerprint: "b7adb34c1e3e1afa25f0fe15a64ba520090284b4ebbfa0ce1606015e3ce3c436", label: "Platinum Portrait Gallery" },
  { id: "gid://shopify/Product/10433361772728", handle: "irontech-celine-164cm-d-cup-silicone-head-companion-doll-2utgj-2", imageFingerprint: "96b419797028f57a88a3b445badbf0f45ec606e82eafcb3fec898487032230dd", label: "Bar Gallery" },
  { id: "gid://shopify/Product/10433361412280", handle: "irontech-celine-164cm-d-cup-silicone-head-companion-doll-2utgj", imageFingerprint: "1df51b2af05bfcafd53a3a3fd2e90e412c94654fc457f8d1546b7291d2c01102", label: "White Bow Gallery" },
  { id: "gid://shopify/Product/10433361117368", handle: "irontech-celine-164cm-d-cup-silicone-head-companion-doll-s38se", imageFingerprint: "2860160d7b85bf36326a8bdda05d473962216c3724912f9c15dd1c1b68e50272", label: "Sofa Gallery" },
  { id: "gid://shopify/Product/10433359872184", handle: "irontech-hedy-164cm-f-cup-silicone-head-companion-doll-ov6r6-2", imageFingerprint: "157a52c138662328345102b7f4fcdf5bc44d3d3aa074f1ddbe69955086a82a66", label: "Orange Sofa Gallery" },
  { id: "gid://shopify/Product/10433359773880", handle: "irontech-hedy-164cm-f-cup-silicone-head-companion-doll-ov6r6", imageFingerprint: "40859153c58a6d3b60d59f70475bfab9f98d6256b55aea8bfa64830090350fa4", label: "Boxing Gallery" },
  { id: "gid://shopify/Product/10433359741112", handle: "irontech-hedy-164cm-f-cup-silicone-companion-doll-1k1vt", imageFingerprint: "49adaa277c23e84e032e75335f4af58e032c47c1f46a95d4f7a7e6b32335e05e", label: "Fantasy Armor Gallery" },
  { id: "gid://shopify/Product/10433357906104", handle: "irontech-vanessa-158cm-h-cup-silicone-companion-doll-fpoia", imageFingerprint: "411e69ea4b243394946b93cabaa4c53269547336547fa966b78a3658e8f52afc", label: "Pink Waistcoat Gallery" },
  { id: "gid://shopify/Product/10433357775032", handle: "irontech-vanessa-158cm-h-cup-silicone-companion-doll-15zcn-2", imageFingerprint: "bf28934041aa4a82e47f7457c304fefbdf54d6c4cec2b75fd035c2bf5538d8f9", label: "White Dress Gallery" },
  { id: "gid://shopify/Product/10433357742264", handle: "irontech-vanessa-158cm-h-cup-silicone-companion-doll-15zcn", imageFingerprint: "c8aa7248748b143048d42d505bda47cfb4fa958b00be8204e56b241f5d651b78", label: "Blue Apron Gallery" },
  { id: "gid://shopify/Product/10433357676728", handle: "irontech-bailey-158cm-h-cup-silicone-companion-doll-10v0f", imageFingerprint: "02d60d52d60d1324096c9b5ebeddfcf8899ceba2a3f3e0597fa221b50769b921", label: "Tiara Gallery" },
  { id: "gid://shopify/Product/10433357119672", handle: "irontech-bailey-158cm-h-cup-silicone-companion-doll-1eg7z-2", imageFingerprint: "0ad35d3acf6f2b3b2b31d6305511a3e0bc751cd5d72acbd995056b8c3fce1aaa", label: "Velvet Dress Gallery" },
  { id: "gid://shopify/Product/10433357086904", handle: "irontech-bailey-158cm-h-cup-silicone-companion-doll-1eg7z", imageFingerprint: "3eee578d103f4aabe22dba3a6448f9438d4b205e2b907218cf1c9b3a2d07bb92", label: "Pink Nightdress Gallery" },
  { id: "gid://shopify/Product/10433357578424", handle: "irontech-evie-159cm-d-cup-silicone-companion-doll-1q981", imageFingerprint: "2bb0629e837fe80c5d46146e16dfb5460a9694cd526eaa0a9ede77921151f80f", label: "Stone Wall Gallery" },
  { id: "gid://shopify/Product/10433357545656", handle: "irontech-evie-159cm-d-cup-silicone-companion-doll-15j38", imageFingerprint: "0f904e373ba52cd4747f2a6888e2bc7c84dd30dfbe4c64b936458382a1375ca4", label: "Black Tulle Gallery" },
  { id: "gid://shopify/Product/10433357480120", handle: "irontech-yui-158cm-f-cup-silicone-companion-doll-12a4d", imageFingerprint: "1dd08f969895afac4fb4626ecc217bf1efcb6a05b8d8ef7a7ec5e417a367f78e", label: "Maid Costume Gallery" },
  { id: "gid://shopify/Product/10433357447352", handle: "irontech-yui-158cm-f-cup-silicone-companion-doll-1t7mt", imageFingerprint: "1a42dabaca844e488fbd908a271afb525c40bf03f79747c5a3e6c64502d4158a", label: "White Cardigan Gallery" },
  { id: "gid://shopify/Product/10433357414584", handle: "irontech-misaki-158cm-f-cup-silicone-companion-doll-hpg0i-2", imageFingerprint: "fe912d768469827eb0d4adf4beba00ad5b85f5e6d1d9b41f9b9a2ea81dd1fc80", label: "Pink Cardigan Gallery" },
  { id: "gid://shopify/Product/10433357381816", handle: "irontech-misaki-158cm-f-cup-silicone-companion-doll-hpg0i", imageFingerprint: "dddf514abfb819849e1a3b76dcba192e4483030c3bde5ea71a6a693057f1697b", label: "White Ruffles Gallery" },
  { id: "gid://shopify/Product/10433357349048", handle: "irontech-misaki-158cm-f-cup-silicone-companion-doll-qukcq", imageFingerprint: "411775bfbb1f5a4ff6f3bd4a5975abb56cdb97d1a28fc27ea8fb160c5538406f", label: "Bath Gallery" },
  { id: "gid://shopify/Product/10433356431544", handle: "irontech-miku-153cm-f-cup-silicone-companion-doll-1itpy", imageFingerprint: "2c17f5a0afc1ba7af5197e82630f539df21eff28bc99ff56b8bf99403e3ab0fc", label: "Pink Blouse Gallery" },
  { id: "gid://shopify/Product/10433356398776", handle: "irontech-miku-153cm-f-cup-silicone-companion-doll-1hhec", imageFingerprint: "9571e593d8fd1ade732b846e9b2419ae2642d92184136b69feee43fb257e9a51", label: "Bedside Gallery" },
  { id: "gid://shopify/Product/10433356857528", handle: "irontech-nia-161cm-f-cup-silicone-head-companion-doll-aynfy-2", imageFingerprint: "48ba6d264ad81ab088b43b6a1a6e1f6c0315ae160caadc19405e151ccb49bd68", label: "Purple Silk Gallery" },
  { id: "gid://shopify/Product/10433356824760", handle: "irontech-nia-161cm-f-cup-silicone-head-companion-doll-aynfy", imageFingerprint: "629c3020de1b73ee390154871972e3a15fc47b160e9d9091eb77f76bf5cd5c69", label: "Cherry Blossom Gallery" },
  { id: "gid://shopify/Product/10433356791992", handle: "irontech-nia-161cm-f-cup-silicone-head-companion-doll-vxwwh", imageFingerprint: "7f39990d3ba7ae9a0189e7815f9b8b4ae0c417a2ca8209bf97edcb57c37c858d", label: "Pink Bodysuit Gallery" },
  { id: "gid://shopify/Product/10433356693688", handle: "irontech-evie-161cm-f-cup-silicone-head-companion-doll-1fnni", imageFingerprint: "6925971057ddc706c4bd4f4e731ce7bf805b0864fe3977981c96ac6528217537", label: "Blue Shorts Gallery" },
  { id: "gid://shopify/Product/10433356660920", handle: "irontech-evie-161cm-f-cup-silicone-head-companion-doll-1usps", imageFingerprint: "7fe51de5a9ad1cfa82f3f3fae544826f07bf045bb92af122f49b03a640c25f11", label: "Yellow Lace Gallery" }
];

export function productReviewedGalleryLabel(product: Product) {
  const look = reviewedLooks.find(item => item.id === product.id && item.handle === product.handle);
  if (!look || !product.featuredImage?.url) return "";
  const fingerprint = createHash("sha256").update(product.featuredImage.url).digest("hex");
  return fingerprint === look.imageFingerprint ? look.label : "";
}

export function productReviewedPdpHeading(product: Product) {
  const heading = productPdpHeading(product);
  const label = productReviewedGalleryLabel(product);
  return label ? `${heading} - ${label}` : heading;
}
