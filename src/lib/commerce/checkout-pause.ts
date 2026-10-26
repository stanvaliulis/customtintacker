import {CommerceError} from './service';
/** Pauses website checkout creation AND reuse, without disabling reconciliation. */
export function checkoutPaused(env:Record<string,string|undefined>):boolean {
 return env.VERCEL_ENV==='production'?env.TIN_CHECKOUT_PAUSED!=='0':env.TIN_CHECKOUT_PAUSED==='1';
}
export function requireCheckoutOpen(env:Record<string,string|undefined>){
 if(checkoutPaused(env))throw new CommerceError('Checkout is temporarily paused. Staff can help with your reviewed order.',503);
}
