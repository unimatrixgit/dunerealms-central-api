/**
 * Shop catalog and order planning for DuneHub.
 *
 * This module deliberately never debits a bank account, grants an item,
 * or claims an order is fulfilled. The production shop must supply an
 * atomic purchase/fulfilment backend before checkout can be enabled.
 */
export interface ShopItem {
 id:string;name:string;description:string;priceDunemarks:string;
 category:'kit'|'cosmetic'|'utility';active:boolean;stock:number|null;
}
export interface ShopOrderPlan {
 itemId:string;quantity:number;unitPriceDunemarks:string;
 totalDunemarks:string;currency:'dunemarks';
}
export class ShopValidationError extends Error {
 constructor(readonly code:string){super(code);}
}
const money=/^(?:0|[1-9][0-9]{0,12})(?:\.[0-9]{1,2})?$/;
const id=/^[a-z0-9][a-z0-9_-]{1,63}$/;
function cents(value:string):bigint{
 if(!money.test(value))throw new ShopValidationError('invalid_price');
 const [whole,fraction='']=value.split('.');
 return BigInt(whole)*100n+BigInt((fraction+'00').slice(0,2));
}
function amount(value:bigint):string{return (value/100n).toString()+'.'+(value%100n).toString().padStart(2,'0');}
export function validateShopCatalog(raw:unknown):ShopItem[]{
 if(!Array.isArray(raw)||raw.length>500)throw new ShopValidationError('invalid_catalog');
 const seen=new Set<string>();
 return raw.map((entry:unknown)=>{
  if(!entry||typeof entry!=='object'||Array.isArray(entry))throw new ShopValidationError('invalid_item');
  const r=entry as Record<string,unknown>;
  if(typeof r.id!=='string'||!id.test(r.id)||seen.has(r.id)||
     typeof r.name!=='string'||!r.name.trim()||r.name.length>100||
     typeof r.description!=='string'||r.description.length>500||
     !['kit','cosmetic','utility'].includes(String(r.category))||
     typeof r.active!=='boolean'||
     !(r.stock===null||(Number.isSafeInteger(r.stock)&&Number(r.stock)>=0))||
     typeof r.priceDunemarks!=='string')throw new ShopValidationError('invalid_item');
  const price=cents(r.priceDunemarks);
  if(price<=0n)throw new ShopValidationError('invalid_price');
  seen.add(r.id);
  return {id:r.id,name:r.name,description:r.description,category:r.category as ShopItem['category'],
   active:r.active,stock:r.stock as number|null,priceDunemarks:amount(price)};
 });
}
export function publicShopCatalog(items:readonly ShopItem[]):ShopItem[]{
 return items.filter(item=>item.active&&(item.stock===null||item.stock>0)).map(item=>({...item}));
}
export function planShopOrder(items:readonly ShopItem[],itemId:string,quantity:unknown):ShopOrderPlan{
 if(typeof itemId!=='string'||!id.test(itemId)||!Number.isSafeInteger(quantity)||
    Number(quantity)<1||Number(quantity)>64)throw new ShopValidationError('invalid_order');
 const item=items.find(x=>x.id===itemId&&x.active);
 if(!item)throw new ShopValidationError('item_unavailable');
 if(item.stock!==null&&item.stock<Number(quantity))throw new ShopValidationError('out_of_stock');
 const total=cents(item.priceDunemarks)*BigInt(Number(quantity));
 if(total>999999999999999n)throw new ShopValidationError('order_too_large');
 return {itemId,quantity:Number(quantity),unitPriceDunemarks:item.priceDunemarks,
  totalDunemarks:amount(total),currency:'dunemarks'};
}
