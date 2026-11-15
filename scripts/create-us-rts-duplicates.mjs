import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const BATCH_SIZE = 10;

let tokenCache = null;

// Source handles to duplicate
const SOURCE_HANDLES = [
  "6ye-bess-senior-165cm-g-cup-tpe-companion-doll-m8kb7",
  "6ye-beverley-160cm-f-cup-tpe-companion-doll-suekn",
  "6ye-bilitis-160cm-f-cup-tpe-companion-doll-b77ky",
  "6ye-bleuenn-160cm-f-cup-tpe-companion-doll-cip8t",
  "6ye-bostwick-150cm-e-cup-tpe-companion-doll-11xkf",
  "6ye-cissy-161cm-l-cup-tpe-companion-doll-1fvfu",
  "6ye-darlene-160cm-d-cup-tpe-companion-doll-zu1to",
  "6ye-debby-151cm-e-cup-tpe-companion-doll-i32v2",
  "6ye-dirona-160cm-d-cup-tpe-companion-doll-jlwy2",
  "6ye-dora-pansy-170cm-d-cup-tpe-companion-doll-1y2wb",
  "6ye-esther-157cm-g-cup-silicone-head-companion-doll-zxoww",
  "6ye-hugo-louisa-165cm-g-cup-tpe-companion-doll-w6kuo",
  "6ye-jupiter-158cm-b-cup-tpe-companion-doll-1cfrd",
  "6ye-larmour-161cm-p-cup-tpe-companion-doll-19vy8",
  "6ye-lena-162cm-h-cup-tpe-companion-doll-8umfd",
  "6ye-leno-162cm-h-cup-tpe-companion-doll-8umfd",
  "6ye-margarites-165cm-i-cup-tpe-companion-doll-1lpuz",
  "6ye-martina-north-152cm-f-cup-tpe-companion-doll-19f26",
  "6ye-monnett-150cm-e-cup-tpe-companion-doll-bddgu",
  "6ye-nydia-gus-170cm-d-cup-tpe-companion-doll-1mprc",
  "6ye-ogden-hart-165cm-g-cup-tpe-companion-doll-1ofzc",
  "6ye-olive-165cm-f-cup-tpe-companion-doll-1lc6x",
  "6ye-ophelia-finn-157cm-g-cup-tpe-companion-doll-5x3xa",
  "6ye-payson-150cm-h-cup-tpe-companion-doll-8i39u",
  "6ye-quinn-160cm-e-cup-tpe-companion-doll-oxlfs",
  "6ye-remmel-165cm-i-cup-tpe-companion-doll-161kz",
  "6ye-rowan-165cm-f-cup-tpe-companion-doll-1ldwi",
  "6ye-suzette-152cm-i-cup-tpe-companion-doll-mqruq",
  "6ye-verna-maria-165cm-n-cup-tpe-companion-doll-19675",
  "6ye-vic-nixon-170cm-d-cup-tpe-companion-doll-pv4iq",
  "6ye-xenia-mark-157cm-e-cup-tpe-companion-doll-yil8a",
  "6ye-zoeigh-165cm-n-cup-tpe-companion-doll-g9xsm",
  "angelkiss-arnold-159cm-f-cup-silicone-companion-doll-1msxp",
  "angelkiss-maddison-165cm-d-cup-silicone-companion-doll-7ofcj",
  "angelkiss-maggie-abe-165cm-d-cup-silicone-companion-doll-1f22w",
  "angelkiss-ruby-165cm-d-cup-silicone-companion-doll-1xxqc",
  "climax-grace-103cm-n-cup-hybrid-companion-doll-1kuxo",
  "climax-s-tori-154cm-c-cup-hybrid-companion-doll-17rm9",
  "dolls-castle-clara-dillon-160cm-f-cup-tpe-companion-doll-1subr",
  "dolls-castle-dequincey-156cm-e-cup-tpe-companion-doll-m8er8",
  "dolls-castle-everleigh-153cm-e-cup-tpe-companion-doll-1f7jw",
  "dolls-castle-fanny-baker-170cm-e-cup-tpe-companion-doll-17704",
  "dolls-castle-flavia-163cm-e-cup-tpe-companion-doll-1h0tc",
  "dolls-castle-gabriella-170cm-e-cup-tpe-companion-doll-189ov",
  "dolls-castle-ichika-170cm-b-cup-tpe-companion-doll-14o98",
  "dolls-castle-iracone-163cm-b-cup-tpe-companion-doll-1jbe6",
  "dolls-castle-kali-153cm-g-cup-silicone-companion-doll-1tict",
  "doll-castle-kali-168cm-m-cup-silicone-companion-doll-1deq1",
  "dolls-castle-lisa-150cm-k-cup-tpe-companion-doll-8zohu",
  "dolls-castle-michaela-168cm-e-cup-tpe-companion-doll-d3ck9",
  "dolls-castle-nikky-157cm-h-cup-tpe-companion-doll-zeqy8",
  "dolls-castle-nikky-163cm-f-cup-tpe-companion-doll-1m07w",
  "dolls-castle-nikky-170cm-g-cup-tpe-companion-doll-15odc",
  "dolls-castle-scarlett-162cm-p-cup-tpe-companion-doll-1jns1",
  "dolls-castle-tallula-153cm-i-cup-tpe-companion-doll-16a6k",
  "dolls-castle-tallula-170cm-g-cup-tpe-companion-doll-3ekg4",
  "dolls-castle-thera-pulitzer-156cm-d-cup-silicone-companion-doll-jkaf6",
  "dolls-castle-vita-hearst-163cm-e-cup-tpe-companion-doll-1ou3r",
  "dolls-castle-willa-163cm-e-cup-tpe-companion-doll-1n928",
  "dolls-castle-zarina-153cm-e-cup-tpe-companion-doll-19dvb",
  "erovenus-brenda-32cm-na-cup-silicone-companion-doll-1hftr",
  "erovenus-chloe-wildd-85cm-f-cup-silicone-companion-doll-4sblg",
  "erovenus-emma-72-5cm-g-cup-silicone-companion-doll-3svp9",
  "erovenus-lauren-54cm-d-cup-silicone-companion-doll-g16fo",
  "hr-dolls-alvira-162cm-l-cup-tpe-companion-doll-6bq1s",
  "hr-dolls-annas-164cm-g-cup-tpe-companion-doll-l3mpq",
  "hr-dolls-anslow-164cm-g-cup-tpe-companion-doll-eun2p",
  "hr-dolls-bell-166cm-a-cup-tpe-companion-doll-a0sq7",
  "hr-dolls-elissa-158cm-c-cup-tpe-companion-doll-3nj1a",
  "hr-dolls-elva-158cm-c-cup-tpe-companion-doll-1guo6",
  "hr-dolls-elvira-168cm-e-cup-tpe-companion-doll-r3pgs",
  "hr-dolls-ewa-158cm-c-cup-tpe-companion-doll-qwqm1",
  "hr-dolls-farida-158cm-c-cup-tpe-companion-doll-3yog9",
  "hr-dolls-felicia-158cm-n-cup-tpe-companion-doll-1n9z5",
  "hr-dolls-fernanda-158cm-n-cup-tpe-companion-doll-1sqfr",
  "hr-dolls-freda-158cm-n-cup-tpe-companion-doll-1rk5d",
  "hr-dolls-hebbe-158cm-n-cup-tpe-companion-doll-1rl0l",
  "hr-dolls-leila-malan-166cm-a-cup-tpe-companion-doll-12ttj",
  "hr-dolls-ulrica-166cm-a-cup-tpe-companion-doll-1f8hl",
  "hr-dolls-valentina-herty-164cm-g-cup-tpe-companion-doll-15ovi",
  "hr-dolls-winni-nichol-166cm-a-cup-tpe-companion-doll-1jwj5",
  "irontech-celine-164cm-f-cup-silicone-head-companion-doll-1t5v3",
  "irontech-eileen-164cm-f-cup-silicone-head-companion-doll-qa1in",
  "irontech-kitty-165cm-g-cup-hybrid-companion-doll-d3pru",
  "irontech-miya-164cm-f-cup-hybrid-companion-doll-1k1z4",
  "jarliet-dolls-blanche-166cm-c-cup-tpe-companion-doll-vn9cd",
  "jarliet-dolls-blandche-166cm-c-cup-tpe-companion-doll-1lmlh",
  "jarliet-dolls-gina-171cm-f-cup-silicone-head-companion-doll-19m4w",
  "jarliet-dolls-helen-165cm-d-cup-tpe-companion-doll-1ng0b",
  "jarliet-dolls-kimberly-153cm-k-cup-tpe-companion-doll-1seq2",
  "jarliet-dolls-may-156cm-b-cup-tpe-companion-doll-1e4bu",
  "jarliet-dolls-pag-153cm-k-cup-silicone-head-companion-doll-3445v",
  "jarliet-dolls-shuyi-149cm-d-cup-silicone-head-companion-doll-htfvu",
  "jarliet-dolls-vicky-171cm-f-cup-tpe-companion-doll-6sjyl",
  "sedoll-annika-d-165cm-c-cup-tpe-companion-doll-vzkdy",
  "sedoll-aryana-c-161cm-e-cup-silicone-companion-doll-1h52g",
  "sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o",
  "sedoll-elma-bertie-161cm-f-cup-tpe-companion-doll-19bgm",
  "sedoll-elonny-150cm-g-cup-tpe-companion-doll-11t6h",
  "sedoll-fiona-151cm-e-cup-tpe-companion-doll-i49a3",
  "sedoll-hazel-d-157cm-h-cup-tpe-companion-doll-1jc3q",
  "sedoll-jean-broad-163cm-e-cup-tpe-companion-doll-1xevc",
  "sedoll-jenny-k-167cm-g-cup-silicone-companion-doll-1p814",
  "sedoll-kemeny-c-161cm-c-cup-silicone-companion-doll-lebg8",
  "sedoll-kemeny-c-163cm-e-cup-tpe-companion-doll-1cwjj",
  "sedoll-kemeny-c-165cm-c-cup-tpe-companion-doll-19iu2",
  "sedoll-maggie-d-165cm-c-cup-silicone-companion-doll-1tg9n",
  "sedoll-makoto-c-161cm-f-cup-tpe-companion-doll-agqh7",
  "sedoll-melody-a-157cm-h-cup-tpe-companion-doll-1syr4",
  "sedoll-queena-a-165cm-c-cup-silicone-companion-doll-o2maf",
  "sedoll-queena-f-157cm-h-cup-tpe-companion-doll-1khdw",
  "sedoll-tracy-b-160cm-c-cup-tpe-companion-doll-1suv1",
  "sedoll-yuuka-i-157cm-h-cup-silicone-companion-doll-195j1",
  "starpery-adele-165cm-g-cup-silicone-head-companion-doll-43fwc",
  "starpery-alva-cotton-174cm-d-cup-silicone-head-companion-doll-hfrs5",
  "starpery-amy-161cm-h-cup-silicone-head-companion-doll-1l9j0-2",
  "starpery-aurora-160cm-k-cup-silicone-companion-doll-879qv",
  "starpery-ayumi-168cm-h-cup-silicone-head-companion-doll-e8je5",
  "starpery-candy-159cm-e-cup-silicone-head-companion-doll-z0szr",
  "starpery-chloe-163cm-g-cup-silicone-head-companion-doll-1lqus",
  "starpery-christina-171cm-d-cup-silicone-head-companion-doll-4vtei",
  "starpery-dache-zheng-169cm-c-cup-silicone-head-companion-doll-fqzd5",
  "starpery-darianna-174cm-d-cup-silicone-head-companion-doll-jiu6f",
  "starpery-divina-156cm-e-cup-silicone-head-companion-doll-1orfc",
  "starpery-eireen-174cm-c-cup-silicone-head-companion-doll-jz4cx",
  "starpery-elizabeth-160cm-k-cup-silicone-companion-doll-1ojrd",
  "starpery-elvire-169cm-c-cup-silicone-head-companion-doll-sztgb",
  "starpery-emeline-156cm-e-cup-silicone-head-companion-doll-1h4k9",
  "starpery-erasma-165cm-d-cup-silicone-head-companion-doll-ex9w8",
  "starpery-essence-165cm-d-cup-silicone-head-companion-doll-117jf",
  "starpery-eugenia-176cm-f-cup-silicone-head-companion-doll-1gzor",
  "starpery-freya-165cm-g-cup-silicone-head-companion-doll-46ftg",
  "starpery-hao-148cm-j-cup-silicone-head-companion-doll-1xwef",
  "starpery-hao-163cm-g-cup-silicone-head-companion-doll-1sd4y",
  "starpery-hao-168cm-h-cup-silicone-head-companion-doll-1b1ho",
  "starpery-honey-148cm-j-cup-silicone-head-companion-doll-1dptr",
  "starpery-imogen-171cm-a-cup-silicone-head-companion-doll-14rxo",
  "starpery-imogen-172cm-f-cup-silicone-head-companion-doll-1yeep",
  "starpery-iris-169cm-c-cup-silicone-head-companion-doll-zqda1",
  "starpery-ivory-161cm-h-cup-silicone-head-companion-doll-wxotg-2",
  "starpery-janelle-171cm-a-cup-silicone-head-companion-doll-16dga",
  "starpery-jin-160cm-k-cup-silicone-companion-doll-l192d",
  "starpery-jin-163cm-c-cup-silicone-head-companion-doll-1j9yw",
  "starpery-joanie-159cm-c-cup-silicone-head-companion-doll-w98a4",
  "starpery-joy-barney-161cm-h-cup-silicone-head-companion-doll-9m782",
  "starpery-julie-172cm-f-cup-silicone-head-companion-doll-1xwfs",
  "starpery-june-louise-171cm-d-cup-silicone-head-companion-doll-6pql5",
  "starpery-leticia-172cm-f-cup-silicone-head-companion-doll-krspu",
  "starpery-lidiya-173cm-g-cup-silicone-head-companion-doll-cb9ok",
  "starpery-lidya-148cm-j-cup-silicone-head-companion-doll-1drww",
  "starpery-liz-sinclair-165cm-d-cup-silicone-head-companion-doll-1180f",
  "starpery-lustina-158cm-x-cup-silicone-companion-doll-1f7vo",
  "starpery-mio-159cm-e-cup-silicone-head-companion-doll-1ptti",
  "starpery-mira-168cm-h-cup-silicone-head-companion-doll-11o2k",
  "starpery-misa-171cm-d-cup-silicone-head-companion-doll-1atc8",
  "starpery-moner-171cm-d-cup-silicone-head-companion-doll-une8o",
  "starpery-natalia-165cm-g-cup-silicone-head-companion-doll-5oyl9",
  "starpery-natalia-171cm-d-cup-silicone-head-companion-doll-1w0i2",
  "starpery-nieve-174cm-d-cup-silicone-head-companion-doll-1vm03",
  "starpery-nieve-176cm-f-cup-silicone-head-companion-doll-kyfgd",
  "starpery-nina-151cm-b-cup-silicone-head-companion-doll-x9nkn",
  "starpery-olivia-174cm-d-cup-silicone-head-companion-doll-1gixe",
  "starpery-phebe-159cm-e-cup-silicone-head-companion-doll-z82ln",
  "starpery-qingwen-163cm-c-cup-silicone-head-companion-doll-ootu4",
  "starpery-qingwen-176cm-c-cup-silicone-head-companion-doll-1jr7k",
  "starpery-rong-151cm-b-cup-silicone-head-companion-doll-x9q92",
  "starpery-rozanne-172cm-f-cup-silicone-head-companion-doll-16moh",
  "starpery-saner-171cm-d-cup-silicone-head-companion-doll-uqg2f",
  "starpery-sidonie-159cm-e-cup-silicone-head-companion-doll-1l9m7",
  "starpery-sunniva-174cm-d-cup-silicone-companion-doll-15nje",
  "starpery-wushi-167cm-e-cup-silicone-head-companion-doll-1myqb",
  "starpery-xue-163cm-g-cup-silicone-head-companion-doll-1sd5a",
  "starpery-ysaline-174cm-c-cup-silicone-head-companion-doll-1swkf",
  "starpery-yufan-151cm-b-cup-silicone-head-companion-doll-111z9",
  "starpery-yufan-159cm-e-cup-silicone-head-companion-doll-zd92j",
  "starpery-yuyan-176cm-c-cup-silicone-head-companion-doll-15a5q",
  "starpery-zoey-148cm-j-cup-silicone-head-companion-doll-zzd8x",
  "tantaly-badd-angel-74cm-i-cup-companion-doll-1odf7",
  "tantaly-candice-pro-55cm-g-cup-companion-doll-98yv5",
  "tantaly-caroline-26cm-companion-doll-rgf5p",
  "tantaly-cecilia-23cm-companion-doll-ehuur",
  "tantaly-daisy-plus-30cm-companion-doll-un114",
  "tantaly-daisy-30cm-companion-doll-1bprj",
  "tantaly-eva-companion-doll-brt1o",
  "tantaly-hannah-64cm-d-cup-companion-doll-191ae",
  "tantaly-hannah-mini-41cm-d-cup-companion-doll-vs9yl",
  "tantaly-jennifer-75cm-j-cup-companion-doll-1af83",
  "tantaly-kylie-27cm-companion-doll-fz5ok",
  "tantaly-louise-companion-doll-i30up",
  "tantaly-miki-50-5cm-d-cup-companion-doll-rsl0g",
  "tantaly-monroe-83cm-i-cup-companion-doll-1lxyn",
  "tantaly-rosie-29cm-companion-doll-860mx",
  "tantaly-scarlett-41cm-f-cup-companion-doll-1p7z1",
  "wm-ada-150cm-m-cup-tpe-companion-doll-n2m01",
  "wm-addison-163cm-h-cup-tpe-companion-doll-1tbg6",
  "wm-adrianna-172cm-b-cup-tpe-companion-doll-rd91h",
  "wm-anae-156cm-h-cup-tpe-companion-doll-17j0e",
  "wm-anastasia-164cm-f-cup-tpe-companion-doll-699uo",
  "wm-aryana-157cm-b-cup-tpe-companion-doll-j933w",
  "wm-audrey-166cm-c-cup-tpe-companion-doll-187yz",
  "wm-belinda-173cm-h-cup-tpe-companion-doll-103m1",
  "wm-cecily-166cm-c-cup-tpe-companion-doll-18x8p",
  "wm-dominique-175cm-d-cup-tpe-companion-doll-ga8a2",
  "wm-effie-175cm-d-cup-tpe-companion-doll-7dopl",
  "wm-eileen-lew-175cm-d-cup-tpe-companion-doll-kwtka",
  "wm-ella-157cm-b-cup-tpe-companion-doll-1tic1",
  "wm-ellemo-174cm-g-cup-tpe-companion-doll-lxciw",
  "wm-gia-166cm-c-cup-tpe-companion-doll-1drow",
  "wm-gillnson-175cm-b-cup-tpe-companion-doll-nz5ro",
  "wm-jayden-173cm-h-cup-tpe-companion-doll-17ulk",
  "wm-jillian-172cm-d-cup-tpe-companion-doll-1hsq1",
  "wm-kelsey-166cm-c-cup-tpe-companion-doll-1cprm",
  "wm-kily-166cm-c-cup-tpe-companion-doll-1f75s",
  "wm-louise-sally-159cm-c-cup-tpe-companion-doll-6akm3",
  "wm-lytton-164cm-f-cup-tpe-companion-doll-1ikx9",
  "wm-meroy-164cm-j-cup-tpe-companion-doll-hye11",
  "wm-minana-162cm-f-cup-tpe-companion-doll-4zfit",
  "wm-miranda-162cm-e-cup-tpe-companion-doll-bzvep",
  "wm-niki-157cm-b-cup-tpe-companion-doll-1tihq",
  "wm-piper-172cm-b-cup-tpe-companion-doll-1akbc",
  "wm-rachel-hal-159cm-c-cup-tpe-companion-doll-htmop",
  "wm-rhianna-173cm-h-cup-tpe-companion-doll-1n7ys",
  "wm-sierra-172cm-d-cup-tpe-companion-doll-qm5b3",
  "wm-southey-162cm-e-cup-tpe-companion-doll-vxe6k",
  "wm-stacy-162cm-e-cup-tpe-companion-doll-oa1l0",
  "wm-teva-160cm-a-cup-tpe-companion-doll-1t3so",
  "wm-truda-166cm-c-cup-tpe-companion-doll-ommrb",
  "wm-willa-172cm-b-cup-tpe-companion-doll-1ao5t",
  "wm-wilma-172cm-d-cup-tpe-companion-doll-18gdg",
  "wm-yaelle-160cm-a-cup-tpe-companion-doll-1pg9n"
];

await loadLocalEnv();

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const execute = Boolean(args.execute);
const limit = Number(args.limit || 0);

if (!execute) {
  console.log(`Dry run: would process ${limit || SOURCE_HANDLES.length} source handles.`);
  console.log("Add --execute to create RTS products in Shopify.");
  process.exit(0);
}

assertShopifyAdminEnv();

console.log(`Processing ${limit || SOURCE_HANDLES.length} source handles...`);

const handlesToProcess = limit ? SOURCE_HANDLES.slice(0, limit) : SOURCE_HANDLES;

// Load product feed
const productFeed = await loadProductFeed();

// Load all Shopify products
const shopifyProducts = await loadAllShopifyProducts();

// Process handles
const results = {
  attempted: handlesToProcess.length,
  created: [],
  skipped_existing_rts: [],
  skipped_already_rts: [],
  skipped_duplicate_identity: [],
  skipped_same_product: [],
  failed: []
};

// Deduplicate handles that resolve to the same product
const handleToProductId = new Map();
for (const handle of handlesToProcess) {
  const product = shopifyProducts.find(p => p.handle === handle);
  if (product) {
    const existing = handleToProductId.get(product.id);
    if (existing) {
      console.log(`⚠️  Handles ${existing} and ${handle} resolve to same product ${product.id}, will clone once`);
    }
    handleToProductId.set(product.id, handle);
  }
}

const uniqueHandles = [...new Set(handlesToProcess)];

for (const sourceHandle of uniqueHandles) {
  try {
    await delay(200); // Rate limiting
    
    const sourceProduct = shopifyProducts.find(p => p.handle === sourceHandle);
    
    if (!sourceProduct) {
      console.log(`❌ Source handle not found: ${sourceHandle}`);
      results.failed.push({ handle: sourceHandle, reason: "source_not_found" });
      continue;
    }

    // Guard 2: Skip if source is already RTS
    if (sourceProduct.stockStatus === "ready_to_ship") {
      console.log(`⏭️  Skipped ${sourceHandle} - already RTS`);
      results.skipped_already_rts.push(sourceHandle);
      continue;
    }

    // Guard 3 & 4: Check for existing RTS with same identity
    const newHandle = `${sourceHandle}-rts-us`;
    const existingRts = findExistingRts(sourceProduct, newHandle, shopifyProducts, productFeed);
    
    if (existingRts) {
      console.log(`⏭️  Skipped ${sourceHandle} - RTS exists: ${existingRts.handle}`);
      results.skipped_existing_rts.push({ source: sourceHandle, existing: existingRts.handle });
      continue;
    }

    // Create the RTS product
    console.log(`🔄 Cloning ${sourceHandle} -> ${newHandle}`);
    const newProduct = await createRtsProduct(sourceProduct, newHandle);
    
    console.log(`✅ Created ${newHandle} (${newProduct.id})`);
    results.created.push({
      source: sourceHandle,
      newHandle: newHandle,
      productId: newProduct.id,
      title: newProduct.title
    });

  } catch (error) {
    console.error(`❌ Failed to process ${sourceHandle}:`, error.message);
    results.failed.push({ handle: sourceHandle, reason: error.message });
  }
}

// Save results
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const resultsPath = path.join(ROOT, "data", "exports", `us-rts-duplicates-${timestamp}.json`);
await fs.mkdir(path.dirname(resultsPath), { recursive: true });
await fs.writeFile(resultsPath, JSON.stringify(results, null, 2), "utf8");

console.log("\n" + "=".repeat(60));
console.log("RESULTS SUMMARY");
console.log("=".repeat(60));
console.log(`Attempted: ${results.attempted}`);
console.log(`Created: ${results.created.length}`);
console.log(`Skipped (already RTS): ${results.skipped_already_rts.length}`);
console.log(`Skipped (existing RTS): ${results.skipped_existing_rts.length}`);
console.log(`Skipped (duplicate identity): ${results.skipped_duplicate_identity.length}`);
console.log(`Skipped (same product): ${results.skipped_same_product.length}`);
console.log(`Failed: ${results.failed.length}`);
console.log(`\nResults saved to: ${path.relative(ROOT, resultsPath)}`);

if (results.created.length > 0) {
  console.log("\nSample created products:");
  results.created.slice(0, 5).forEach(item => {
    console.log(`  - https://dollwow.com/products/${item.newHandle}`);
  });
}

function findExistingRts(sourceProduct, newHandle, shopifyProducts, productFeed) {
  // Check for exact handle match
  const handleMatch = shopifyProducts.find(p => p.handle === newHandle);
  if (handleMatch) return handleMatch;

  // Check for same brand + normalized name + height + material + RTS
  const sourceName = normalizeName(sourceProduct.displayName || sourceProduct.title);
  const sourceBrand = normalize(sourceProduct.brand || sourceProduct.vendor);
  const sourceHeight = sourceProduct.heightCm;
  const sourceMaterial = normalize(sourceProduct.material);

  const identityMatch = shopifyProducts.find(p => {
    if (p.stockStatus !== "ready_to_ship") return false;
    const pName = normalizeName(p.displayName || p.title);
    const pBrand = normalize(p.brand || p.vendor);
    const pHeight = p.heightCm;
    const pMaterial = normalize(p.material);
    
    return pBrand === sourceBrand && 
           pName === sourceName && 
           pHeight === sourceHeight && 
           pMaterial === sourceMaterial;
  });

  return identityMatch || null;
}

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\s+(customizable|companion|doll|head|torso|ready|to|ship)\s*/gi, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function createRtsProduct(sourceProduct, newHandle) {
  // Use productDuplicate then update
  const duplicateData = await adminFetch(
    `mutation ProductDuplicate($productId: ID!, $newTitle: String!, $newHandle: String!) {
      productDuplicate(
        productId: $productId,
        newTitle: $newTitle,
        newHandle: $newHandle,
        includeImages: true
      ) {
        newProduct {
          id
          handle
          title
          status
          variants(first: 1) {
            nodes { id price }
          }
        }
        userErrors { field message }
      }
    }`,
    {
      productId: sourceProduct.id,
      newTitle: sourceProduct.title,
      newHandle: newHandle
    }
  );

  const error = duplicateData.productDuplicate.userErrors[0];
  if (error) {
    throw new Error(`productDuplicate failed: ${formatUserError(error)}`);
  }

  const newProduct = duplicateData.productDuplicate.newProduct;
  if (!newProduct) {
    throw new Error("Shopify did not return duplicated product");
  }

  // Update with RTS-specific metafields and tags
  const now = new Date().toISOString();
  const updateData = await adminFetch(
    `mutation ProductUpdate($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        product { id handle title status }
        userErrors { field message }
      }
    }`,
    {
      product: {
        id: newProduct.id,
        status: "ACTIVE",
        tags: buildRtsTags(sourceProduct),
        metafields: [
          { namespace: "custom", key: "stock_status", type: "single_line_text_field", value: "ready_to_ship" },
          { namespace: "custom", key: "custom_available", type: "boolean", value: "false" },
          { namespace: "custom", key: "warehouse_country", type: "single_line_text_field", value: "United States" },
          { namespace: "custom", key: "warehouse_regions", type: "json", value: JSON.stringify(["United States"]) },
          { namespace: "custom", key: "stock_last_checked_at", type: "date_time", value: now },
          { namespace: "custom", key: "qc_note", type: "multi_line_text_field", value: `US warehouse unit confirmed on Rosemary in-stock 2026-08-26; cloned from custom handle ${sourceProduct.handle}; review warehouse options before treating as exact as-shown if needed` },
          { namespace: "custom", key: "delivery_estimate", type: "single_line_text_field", value: "Est. 3 business days" }
        ]
      }
    }
  );

  const updateError = updateData.productUpdate.userErrors[0];
  if (updateError) {
    throw new Error(`productUpdate failed: ${formatUserError(updateError)}`);
  }

  // Publish to storefront
  await publishProduct(newProduct.id);

  return updateData.productUpdate.product;
}

function buildRtsTags(sourceProduct) {
  const tags = sourceProduct.tags ? [...sourceProduct.tags] : [];
  
  // Remove 'custom' tag
  const filtered = tags.filter(t => t.toLowerCase() !== "custom");
  
  // Add RTS tags
  if (!filtered.some(t => t.toLowerCase() === "ready_to_ship")) {
    filtered.push("ready_to_ship");
  }
  if (!filtered.some(t => t.toLowerCase() === "warehouse-united-states")) {
    filtered.push("warehouse-united-states");
  }
  
  return filtered;
}

async function publishProduct(productId) {
  const publications = await getTargetPublications();
  if (!publications.length) {
    console.warn("⚠️  No publications found for publishing");
    return;
  }

  const data = await adminFetch(
    `mutation PublishProduct($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        userErrors { field message }
      }
    }`,
    {
      id: productId,
      input: publications.map(pub => ({ publicationId: pub.id }))
    }
  );

  const error = data.publishablePublish.userErrors[0];
  if (error) {
    throw new Error(`publishablePublish failed: ${formatUserError(error)}`);
  }
}

let publicationCache = null;

async function getTargetPublications() {
  if (publicationCache) return publicationCache;
  
  const data = await adminFetch(
    `query Publications {
      publications(first: 50) {
        nodes { id name }
      }
    }`
  );
  
  publicationCache = data.publications.nodes.filter(pub => 
    /headless|online store/i.test(pub.name || "")
  );
  
  return publicationCache;
}

async function loadProductFeed() {
  try {
    const response = await fetch("https://dollwow.com/product-feed.json");
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("⚠️  Could not load product feed:", error.message);
    return [];
  }
}

async function loadAllShopifyProducts() {
  console.log("Loading all Shopify products...");
  const products = [];
  let after = null;
  
  do {
    const data = await adminFetch(
      `query Products($after: String) {
        products(first: 250, after: $after) {
          nodes {
            id
            handle
            title
            vendor
            status
            tags
            featuredImage { url }
            brand: metafield(namespace: "custom", key: "brand") { value }
            displayName: metafield(namespace: "custom", key: "display_name") { value }
            stockStatus: metafield(namespace: "custom", key: "stock_status") { value }
            material: metafield(namespace: "custom", key: "material") { value }
            heightCm: metafield(namespace: "custom", key: "height_cm") { value }
            cupSize: metafield(namespace: "custom", key: "cup_size") { value }
            sourceUrl: metafield(namespace: "custom", key: "source_url") { value }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { after }
    );
    
    products.push(...data.products.nodes.map(node => ({
      ...node,
      tags: node.tags || [],
      brand: node.brand?.value || "",
      displayName: node.displayName?.value || "",
      stockStatus: node.stockStatus?.value || "",
      material: node.material?.value || "",
      heightCm: node.heightCm?.value ? Number(node.heightCm.value) : null,
      cupSize: node.cupSize?.value || "",
      sourceUrl: node.sourceUrl?.value || ""
    })));
    
    after = data.products.pageInfo.endCursor;
    if (!data.products.pageInfo.hasNextPage) break;
  } while (after);
  
  console.log(`Loaded ${products.length} Shopify products`);
  return products;
}

async function adminFetch(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");
  const accessToken = await getAdminAccessToken(domain);
  
  const response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken
    },
    body: JSON.stringify({ query, variables })
  });
  
  const payload = await response.json();
  
  if (!response.ok || payload.errors?.length) {
    const message = payload.errors?.[0]?.message || `HTTP ${response.status}`;
    throw new Error(`Shopify Admin API request failed: ${message}`);
  }
  
  return payload.data;
}

async function getAdminAccessToken(domain) {
  if (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
    return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  }
  
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }
  
  if (!process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) {
    throw new Error("Shopify Admin API requires SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET.");
  }

  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET
    })
  });
  
  const payload = await response.json();
  
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Failed to mint Shopify Admin access token.");
  }

  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max((payload.expires_in || 3600) - 60, 60) * 1000
  };
  
  return tokenCache.accessToken;
}

function formatUserError(error) {
  const field = Array.isArray(error.field) ? error.field.join(".") : error.field;
  return field ? `${field}: ${error.message}` : error.message;
}

function assertShopifyAdminEnv() {
  if (!process.env.SHOPIFY_STORE_DOMAIN || !(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET))) {
    throw new Error("SHOPIFY_STORE_DOMAIN plus SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET are required for --execute.");
  }
}

async function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env.local");
  try {
    const text = await fs.readFile(envPath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index === -1) continue;
      const key = line.slice(0, index).trim();
      let value = line.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] ||= value;
    }
  } catch {
    // Local env is optional for dry runs
  }
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (key === "help" || key === "execute") {
      parsed[key] = true;
    } else {
      parsed[key] = values[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function printHelp() {
  console.log(`Usage:
  npm run create:us-rts-duplicates
  npm run create:us-rts-duplicates -- --execute
  npm run create:us-rts-duplicates -- --execute --limit 5

Duplicates custom products into US ready-to-ship listings.
Dry-runs by default. Add --execute to create products in Shopify.
Add --limit N to process only first N handles.`);
}
