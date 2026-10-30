import type {Product} from '@/types/product';

// Body versions from the current factory PO; named heads are not version evidence.
export const gynoidVersionPreviewMappings = [
  {model:'M13',handle:'gynoid-lisa-170cm-silicone-companion-doll-model-13',productId:'preview:gynoid:10637911163064',standardUSD:5299,deluxeUSD:5799},
  {model:'M21',handle:'gynoid-elsa-164cm-silicone-companion-doll-model-21',productId:'preview:gynoid:10637915029688',standardUSD:4799,deluxeUSD:5099}
] as const;

/** Called only on cloned, disabled-checkout private preview products. */
export function applyGynoidVersionPreview(product:Product) {
  const mapping=gynoidVersionPreviewMappings.find(row=>row.productId===product.id&&row.handle===product.handle);
  if(!mapping)return;
  const standard=product.variants[0];
  if(product.variants.length!==1||Number(standard?.price.amount)!==mapping.standardUSD||standard.price.currencyCode!=='USD'){
    throw new Error('Gynoid body version preview requires the exact retained Standard variant.');
  }
  product.variants=[
    {...standard,title:'Standard body',availableForSale:false,selectedOptions:[{name:'Body version',value:'Standard'}]},
    {...standard,id:`${standard.id}:deluxe`,title:'Deluxe body',availableForSale:false,
      price:{amount:String(mapping.deluxeUSD),currencyCode:'USD'},selectedOptions:[{name:'Body version',value:'Deluxe'}]}
  ];
  product.priceRange={minVariantPrice:{...standard.price},maxVariantPrice:{amount:String(mapping.deluxeUSD),currencyCode:'USD'}};
  product.extended.measurements={...product.extended.measurements,
    'Body versions':'Standard or Deluxe; Deluxe has factory life-cast hand and foot detailing',
    'Body weight by version':mapping.model==='M13'?'Standard 30 kg; Deluxe 32 kg (body only, +/-3 kg)':'Standard and Deluxe 30 kg (body only, +/-3 kg)'};
  if(mapping.model==='M13'){
    delete product.extended.measurements.Bust;
    product.extended.measurements['Bust by body version']='Standard 89 cm; Deluxe 91 cm';
  }
}
