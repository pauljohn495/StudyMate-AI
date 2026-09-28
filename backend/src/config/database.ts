import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { env } from './env.js';

export interface RowDataPacket { [key:string]:unknown }
export interface ResultSetHeader { affectedRows:number }

const databaseUrl=()=>{
  if(env.NODE_ENV!=='production')return env.DATABASE_URL;
  const url=new URL(env.DATABASE_URL);
  // node-postgres replaces an explicit SSL object when these URL options exist.
  // Keep TLS controlled here so Supabase's pooler certificate chain works on Render.
  for(const parameter of ['sslmode','sslcert','sslkey','sslrootcert'])url.searchParams.delete(parameter);
  return url.toString();
};

const pool=new Pool({connectionString:databaseUrl(),max:env.DB_POOL_MAX,idleTimeoutMillis:30_000,connectionTimeoutMillis:10_000,ssl:env.NODE_ENV==='production'?{rejectUnauthorized:false}:undefined});
const parameterize=(sql:string)=>{let index=0;return sql.replace(/\?/g,()=>`$${++index}`);};

class DatabaseConnection {
  constructor(private readonly client:PoolClient){}
  async query<T extends QueryResultRow[]=RowDataPacket[]>(sql:string,values:unknown[]=[]):Promise<[T]>{const result=await this.client.query(parameterize(sql),values);return[result.rows as T];}
  async execute<T extends ResultSetHeader=ResultSetHeader>(sql:string,values:unknown[]=[]):Promise<[T]>{const result=await this.client.query(parameterize(sql),values);return[{affectedRows:result.rowCount??0} as T];}
  beginTransaction(){return this.client.query('BEGIN').then(()=>undefined);}
  commit(){return this.client.query('COMMIT').then(()=>undefined);}
  rollback(){return this.client.query('ROLLBACK').then(()=>undefined);}
  release(){this.client.release();}
}

export const db={
  async query<T extends QueryResultRow[]=RowDataPacket[]>(sql:string,values:unknown[]=[]):Promise<[T]>{const result=await pool.query(parameterize(sql),values);return[result.rows as T];},
  async execute<T extends ResultSetHeader=ResultSetHeader>(sql:string,values:unknown[]=[]):Promise<[T]>{const result=await pool.query(parameterize(sql),values);return[{affectedRows:result.rowCount??0} as T];},
  async getConnection(){return new DatabaseConnection(await pool.connect());},
  end(){return pool.end();}
};

pool.on('error',error=>console.error('Unexpected PostgreSQL pool error',error));
