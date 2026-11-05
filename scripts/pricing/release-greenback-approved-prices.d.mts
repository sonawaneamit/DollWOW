export function greenbackNonPriceFingerprint(product: any): string;
export function validateGreenbackPriceScope(manifest: any, products: any[]): Array<{row:any;product:any;needsChange:boolean}>;
export function greenbackPriceMutationVariables(row: any): {productId:string;variants:Array<{id:string;price:string}>};
