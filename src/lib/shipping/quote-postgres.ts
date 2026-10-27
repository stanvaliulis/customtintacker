import type {QuoteStore} from './quote-service';
type Row={payload:Parameters<QuoteStore['put']>[1]};
type Sql={query<T>(sql:string,values:unknown[]):Promise<T[]>};
/** Prepared adapter only; no runtime connection or schema mutation. */
export function postgresQuoteStore(db:Sql):QuoteStore{return {
 async put(id,value){await db.query('INSERT INTO tin_shipping.quote(id,owner_id,expires_at,payload) VALUES($1,$2,$3,$4::jsonb)',[id,value.owner,new Date(value.expires),JSON.stringify(value)]);},
 async get(id){const rows=await db.query<Row>('SELECT payload FROM tin_shipping.quote WHERE id=$1 AND expires_at>now()',[id]);return rows[0]?.payload;},
};}
