import { CommerceError, type Dependencies } from './service';
import {StorageError} from '../artwork-storage/service';
/** Review build deliberately has no provider/repository credentials or activation switch. */
export function commerceDependencies(): Dependencies {
  throw new CommerceError('Checkout activation blocked: approve policy and durable repository integration first.', 503);
}
export function failure(error: unknown) {
  const known=error instanceof CommerceError||error instanceof StorageError;
  return Response.json({ error: known ? error.message : 'Order processing unavailable. Retry with the same request key.' }, { status: known ? error.status : 503, headers: { 'Cache-Control': 'no-store' } });
}
