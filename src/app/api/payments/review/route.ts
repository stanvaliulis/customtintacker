import {paymentHttp} from '@/lib/commerce/payment-http';
import {paymentActions} from '@/lib/persistence/payments';
export const runtime='nodejs';
export const GET=paymentHttp(paymentActions).customerGet;
