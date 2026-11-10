import test from 'node:test';
import assert from 'node:assert/strict';
import {validateShopCatalog,publicShopCatalog,planShopOrder,ShopValidationError} from '../src/shop.js';
const catalog=[
 {id:'fremen_kit',name:'Fremen Kit',description:'In-game kit',category:'kit',active:true,stock:2,priceDunemarks:'15.25'},
 {id:'retired',name:'Retired',description:'Not for sale',category:'cosmetic',active:false,stock:null,priceDunemarks:'1.00'}
];
test('shop catalog validates and hides inactive items',()=>{
 const items=validateShopCatalog(catalog);
 assert.equal(publicShopCatalog(items).length,1);
 assert.equal(publicShopCatalog(items)[0].id,'fremen_kit');
});
test('shop order uses exact cents, not floating point',()=>{
 const items=validateShopCatalog(catalog);
 assert.deepEqual(planShopOrder(items,'fremen_kit',2),{
  itemId:'fremen_kit',quantity:2,unitPriceDunemarks:'15.25',totalDunemarks:'30.50',currency:'dunemarks'
 });
});
test('shop rejects overselling, disabled items and bad quantities',()=>{
 const items=validateShopCatalog(catalog);
 for(const args of [['fremen_kit',3],['retired',1],['fremen_kit',0],['fremen_kit',1.5],['fremen_kit',65],['../etc',1]]){
  assert.throws(()=>planShopOrder(items,args[0],args[1]),ShopValidationError);
 }
});
test('shop rejects duplicate IDs, malformed prices and negative stock',()=>{
 for(const bad of [[catalog[0],catalog[0]],[{...catalog[0],priceDunemarks:'0.00'}],
  [{...catalog[0],priceDunemarks:'1e10'}],[{...catalog[0],stock:-1}]]){
  assert.throws(()=>validateShopCatalog(bad),ShopValidationError);
 }
});
