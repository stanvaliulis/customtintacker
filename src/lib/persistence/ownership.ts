import {StorageError} from '../artwork-storage/service';
/** Supply the existing server auth() result only after its session/JWT verification.
 * Account capabilities come from the server account database, never client claims or email matching. */
export function ownedPrincipal(session:()=>Promise<{user?:{id?:string};expires?:string}|null>,account:(subject:string)=>Promise<{id:string;enabled:boolean;canPrepareProofs:boolean}|null>,now=Date.now){
 return async()=>{const s=await session(),subject=s?.user?.id;if(!subject||!s?.expires||!Number.isFinite(Date.parse(s.expires))||Date.parse(s.expires)<=now())throw new StorageError('Verified unexpired customer session required.',401);
  const a=await account(subject);if(!a||!a.enabled||a.id!==subject)throw new StorageError('Account unavailable.',403);return {ownerId:a.id,canPrepareProofs:a.canPrepareProofs===true};};
}
