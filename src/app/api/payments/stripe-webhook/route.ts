import {paymentHttp} from '@/lib/commerce/payment-http';
import {paymentActions} from '@/lib/persistence/payments';
export const runtime='nodejs';
export const POST=paymentHttp(paymentActions).webhookPost;
