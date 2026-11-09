import {redirect} from 'next/navigation';
import {isAdminAuthenticated} from '@/lib/admin-auth';

/** Keep the Orders navigation on the real, protected request workflow. */
export default async function OrdersPage(){
 if(!(await isAdminAuthenticated()))redirect('/admin/login');
 redirect('/admin/invoice-requests');
}
